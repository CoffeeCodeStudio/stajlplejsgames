import { useState, useEffect } from "react";
import { Search, UserPlus, Loader2, Info, Check } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface UserResult {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  city: string | null;
  gender: string | null;
  age: number | null;
}

interface UserSearchProps {
  onViewProfile?: (userId: string) => void;
}

export function UserSearch({ onViewProfile }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState<Set<string>>(new Set());
  const [existingFriends, setExistingFriends] = useState<Set<string>>(new Set());
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const showDemoMode = !authLoading && !user;

  // Fetch existing friend connections
  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      const { data } = await supabase
        .from("friends")
        .select("friend_id, user_id, status")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (data) {
        const friends = new Set<string>();
        const requests = new Set<string>();
        data.forEach((f) => {
          const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
          if (f.status === "accepted") {
            friends.add(otherId);
          } else if (f.status === "pending") {
            requests.add(otherId);
          }
        });
        setExistingFriends(friends);
        setFriendRequests(requests);
      }
    };

    fetchFriends();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('user-search-friends')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchFriends)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Realtime fuzzy search with debounce - search ALL users
  useEffect(() => {
    if (!user) {
      setResults([]);
      return;
    }

    // Show all users if search is empty, or filter by search query
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let query = supabase
          .from("profiles")
          .select("id, user_id, username, avatar_url, city, gender, age")
          .neq("user_id", user.id)
          .limit(50);

        // Fuzzy search - case insensitive, works with single character
        if (searchQuery.trim()) {
          query = query.ilike("username", `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query.order("username", { ascending: true });

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        toast({
          title: "Sökning misslyckades",
          description: "Försök igen senare",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 150); // Fast 150ms debounce for realtime feel

    return () => clearTimeout(timer);
  }, [searchQuery, user, toast]);

  const handleSearch = async () => {
    // Manual search trigger (for Enter key)
    if (!searchQuery.trim() || !user) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, username, avatar_url, city, gender, age")
        .ilike("username", `%${searchQuery.trim()}%`)
        .neq("user_id", user.id)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Sökning misslyckades",
        description: "Försök igen senare",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!user) return;

    setPendingAdds((prev) => new Set(prev).add(targetUserId));
    try {
      const { error } = await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: targetUserId,
        status: "pending",
      });

      if (error) throw error;

      setFriendRequests((prev) => new Set(prev).add(targetUserId));
      toast({
        title: "Vänförfrågan skickad!",
        description: "Väntar på godkännande",
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Kunde inte skicka förfrågan",
        description: "Försök igen senare",
        variant: "destructive",
      });
    } finally {
      setPendingAdds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const getButtonState = (userId: string) => {
    if (existingFriends.has(userId)) return "friend";
    if (friendRequests.has(userId)) return "pending";
    if (pendingAdds.has(userId)) return "adding";
    return "add";
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Demo mode banner */}
        {showDemoMode && (
          <div className="nostalgia-card p-3 mb-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">Logga in</button> för att söka efter användare!
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="nostalgia-card p-4 mb-6">
          <h1 className="font-display font-bold text-xl mb-1">🔍 Hitta Vänner</h1>
          <p className="text-sm text-muted-foreground">
            Sök bland alla medlemmar i communityt. Börja skriva för att hitta någon!
          </p>
        </div>

        {/* Search Box */}
        <div className="nostalgia-card p-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Sök på användarnamn..."
                className="pl-9"
                disabled={showDemoMode}
              />
            </div>
            <Button 
              variant="msn" 
              onClick={handleSearch}
              disabled={showDemoMode || isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sök"
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="nostalgia-card overflow-hidden divide-y divide-border">
            <div className="px-4 py-2 bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground">
                {results.length} resultat
              </span>
            </div>
            {results.map((profile) => {
              const buttonState = getButtonState(profile.user_id);
              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <Avatar name={profile.username} src={profile.avatar_url} size="md" />
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/profile/${encodeURIComponent(profile.username)}`)}
                  >
                    <span className="font-semibold text-sm block hover:text-primary transition-colors">{profile.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {profile.gender && `${profile.gender}`}
                      {profile.age && `, ${profile.age} år`}
                      {profile.city && ` från ${profile.city}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {buttonState === "friend" ? (
                      <Button variant="ghost" size="sm" disabled className="text-primary">
                        <Check className="w-4 h-4 mr-1" />
                        Vänner
                      </Button>
                    ) : buttonState === "pending" ? (
                      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                        Väntande
                      </Button>
                    ) : buttonState === "adding" ? (
                      <Button variant="ghost" size="sm" disabled>
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </Button>
                    ) : (
                      <Button 
                        variant="msn" 
                        size="sm"
                        onClick={() => handleAddFriend(profile.user_id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Lägg till
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isSearching && results.length === 0 && searchQuery && user && (
          <div className="nostalgia-card p-8 text-center">
            <p className="text-lg font-semibold text-muted-foreground mb-1">🌟 Här var det tomt!</p>
            <p className="text-sm text-muted-foreground">Inga användare hittades med det namnet</p>
          </div>
        )}
      </section>
    </div>
  );
}
