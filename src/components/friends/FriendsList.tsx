import { useState, useEffect } from "react";
import { Search, UserPlus, Info, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FriendCard, FRIEND_CATEGORIES, type FriendData, type FriendCategory } from "./FriendCard";
import type { UserStatus } from "../StatusIndicator";
import { usePresence } from "@/hooks/usePresence";

interface FriendsListProps {
  onSendMessage?: (userId: string) => void;
}

export function FriendsList({ onSendMessage }: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "best" | "pending">("all");
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getUserStatus } = usePresence();

  const isLoggedOut = !authLoading && !user;

  // Fetch friends from database
  useEffect(() => {
    if (isLoggedOut || !user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const { data: friendships, error } = await supabase
          .from("friends")
          .select("*")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (error) throw error;

        if (!friendships || friendships.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const friendUserIds = friendships.map((f) =>
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message, last_seen")
          .in("user_id", friendUserIds);

        if (profilesError) throw profilesError;

        const friendsList: FriendData[] = friendships.map((friendship) => {
          const friendUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
          const profile = profiles?.find((p) => p.user_id === friendUserId);
          const isIncoming = friendship.friend_id === user.id && friendship.status === "pending";

          // Use real-time presence first, fall back to last_seen for bots/offline users
          let status: UserStatus = getUserStatus(friendUserId);
          if (status === 'offline' && profile?.last_seen) {
            const lastSeenMs = new Date(profile.last_seen).getTime();
            const now = Date.now();
            const threeMinutesAgo = now - 3 * 60 * 1000;
            const eightMinutesAgo = now - 8 * 60 * 1000;
            if (lastSeenMs > threeMinutesAgo) {
              status = 'online';
            } else if (lastSeenMs > eightMinutesAgo) {
              status = 'away';
            }
          }

          return {
            id: friendUserId,
            name: profile?.username || "Okänd",
            username: profile?.username || "okand",
            avatar: profile?.avatar_url || undefined,
            status,
            statusMessage: profile?.status_message || "",
            isBestFriend: friendship.is_best_friend,
            friendshipId: friendship.id,
            friendshipStatus: friendship.status,
            isIncoming,
            category: (friendship.category || 'Nätvän') as FriendCategory,
          };
        });

        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast({
          title: "Kunde inte hämta vänner",
          description: "Försök igen senare",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    const channel = supabase
      .channel("friends-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "friends" }, () => fetchFriends())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoggedOut, toast]);

  const handleAccept = async (friendshipId: string) => {
    if (!user) return;
    setActionLoading(friendshipId);
    try {
      const { error } = await supabase.from("friends").update({ status: "accepted" }).eq("id", friendshipId);
      if (error) throw error;
      toast({ title: "Vänförfrågan accepterad!" });
    } catch {
      toast({ title: "Kunde inte acceptera", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (friendshipId: string) => {
    if (!user) return;
    setActionLoading(friendshipId);
    try {
      const { error } = await supabase.from("friends").delete().eq("id", friendshipId);
      if (error) throw error;
      toast({ title: "Vänförfrågan avvisad" });
    } catch {
      toast({ title: "Kunde inte avvisa", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBestFriend = async (friendshipId: string, currentValue: boolean) => {
    if (!user) return;
    setActionLoading(friendshipId);
    try {
      const { error } = await supabase.from("friends").update({ is_best_friend: !currentValue }).eq("id", friendshipId);
      if (error) throw error;
      setFriends((prev) =>
        prev.map((f) => (f.friendshipId === friendshipId ? { ...f, isBestFriend: !currentValue } : f))
      );
    } catch {
      console.error("Error toggling best friend");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!user) return;
    setActionLoading(friendshipId);
    try {
      const { error } = await supabase.from("friends").delete().eq("id", friendshipId);
      if (error) throw error;
      toast({ title: "Vän borttagen" });
    } catch {
      toast({ title: "Kunde inte ta bort vän", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // Filter friends
  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "online") return matchesSearch && friend.status !== "offline" && friend.friendshipStatus === "accepted";
    if (filter === "best") return matchesSearch && friend.isBestFriend && friend.friendshipStatus === "accepted";
    if (filter === "pending") return matchesSearch && friend.friendshipStatus === "pending" && friend.isIncoming;
    if (filter === "all") return matchesSearch && friend.friendshipStatus === "accepted";
    return matchesSearch;
  });

  // Group friends by category
  const groupedFriends = FRIEND_CATEGORIES.reduce<Record<string, FriendData[]>>((acc, cat) => {
    const inCat = filteredFriends.filter((f) => f.category === cat);
    if (inCat.length > 0) acc[cat] = inCat;
    return acc;
  }, {});

  // Pending friends shown separately
  const pendingFriends = friends.filter((f) => f.friendshipStatus === "pending" && f.isIncoming);

  const onlineCount = friends.filter((f) => f.status !== "offline" && f.friendshipStatus === "accepted").length;
  const acceptedCount = friends.filter((f) => f.friendshipStatus === "accepted").length;
  const pendingCount = pendingFriends.length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Login prompt */}
        {isLoggedOut && (
          <div className="nostalgia-card p-3 mb-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">Logga in</button> för att se och hantera dina vänner!
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="nostalgia-card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-bold text-xl mb-1">👥 Mina Vänner</h1>
              <p className="text-sm text-muted-foreground">
                {acceptedCount > 0
                  ? `${onlineCount} av ${acceptedCount} online just nu`
                  : "Du har inga vänner ännu"}
              </p>
            </div>
            {!isLoggedOut ? (
              <Button variant="msn" onClick={() => navigate("/?tab=sok")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Hitta vänner
              </Button>
            ) : (
              <Button variant="msn" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök bland vänner..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { key: "all", label: `Alla (${acceptedCount})`, activeClass: "bg-primary text-primary-foreground" },
            { key: "online", label: `Online (${onlineCount})`, activeClass: "bg-primary text-primary-foreground" },
            { key: "best", label: "⭐ Bästa vänner", activeClass: "bg-accent text-accent-foreground" },
          ] as const).map(({ key, label, activeClass }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                filter === key ? activeClass : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
          {pendingCount > 0 && (
            <button
              onClick={() => setFilter("pending")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                filter === "pending"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Förfrågningar ({pendingCount})
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && !isLoggedOut && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Friends grouped by category */}
        {!loading && (
          <div className="space-y-4">
            {filter === "pending" ? (
              <div className="nostalgia-card overflow-hidden">
                {pendingFriends.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">Inga väntande vänförfrågningar</p>
                  </div>
                ) : (
                  pendingFriends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      isLoggedOut={isLoggedOut}
                      actionLoading={actionLoading}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onToggleBestFriend={handleToggleBestFriend}
                      onRemove={handleRemoveFriend}
                      onSendMessage={onSendMessage}
                    />
                  ))
                )}
              </div>
            ) : Object.keys(groupedFriends).length === 0 ? (
              <div className="nostalgia-card p-8 text-center text-muted-foreground">
                <p className="text-lg mb-2">🌟 Här var det tomt!</p>
                {friends.length === 0 && !isLoggedOut ? (
                  <p className="text-sm">Sök efter vänner för att komma igång.</p>
                ) : (
                  <p className="text-sm">Inga vänner hittades</p>
                )}
              </div>
            ) : (
              Object.entries(groupedFriends).map(([category, categoryFriends]) => (
                <div key={category} className="nostalgia-card overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {collapsedCategories.has(category) ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>{category}</span>
                    <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {categoryFriends.length}
                    </span>
                  </button>
                  {!collapsedCategories.has(category) &&
                    categoryFriends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        isLoggedOut={isLoggedOut}
                        actionLoading={actionLoading}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        onToggleBestFriend={handleToggleBestFriend}
                        onRemove={handleRemoveFriend}
                        onSendMessage={onSendMessage}
                      />
                    ))}
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
