import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator } from "./StatusIndicator";
import { PersonalityMeter } from "./PersonalityMeter";
import { useFriendVotes } from "@/hooks/useFriendVotes";
import { FRIEND_CATEGORIES } from "./friends/FriendCard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePresence } from "@/hooks/usePresence";

interface ProfileFriend {
  id: string;
  username: string;
  avatar_url: string | null;
  status_message: string | null;
  category: string;
  is_best_friend: boolean;
}

interface ProfileFriendsTabProps {
  userId: string;
}

export function ProfileFriendsTab({ userId }: ProfileFriendsTabProps) {
  const [friends, setFriends] = useState<ProfileFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { getUserStatus } = usePresence();

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const { data: friendships, error } = await supabase
          .from("friends")
          .select("*")
          .eq("status", "accepted")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (error) throw error;
        if (!friendships || friendships.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const friendUserIds = friendships.map((f) =>
          f.user_id === userId ? f.friend_id : f.user_id
        );

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message")
          .in("user_id", friendUserIds);

        const list: ProfileFriend[] = friendships.map((f) => {
          const friendId = f.user_id === userId ? f.friend_id : f.user_id;
          const profile = profiles?.find((p) => p.user_id === friendId);
          return {
            id: friendId,
            username: profile?.username || "Okänd",
            avatar_url: profile?.avatar_url || null,
            status_message: profile?.status_message || null,
            category: f.category || "Nätvän",
            is_best_friend: f.is_best_friend,
          };
        });

        setFriends(list);
      } catch (err) {
        console.error("Error fetching profile friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [userId]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group by category
  const grouped = FRIEND_CATEGORIES.reduce<Record<string, ProfileFriend[]>>((acc, cat) => {
    const inCat = friends.filter((f) => f.category === cat);
    if (inCat.length > 0) acc[cat] = inCat;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        🌟 Inga vänner ännu
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-3">
        {friends.length} vän{friends.length !== 1 ? "ner" : ""}
      </p>

      {Object.entries(grouped).map(([category, categoryFriends]) => (
        <div key={category} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(category)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold bg-muted/30 hover:bg-muted/50 transition-colors"
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

          {!collapsedCategories.has(category) && (
            <div className="divide-y divide-border">
              {categoryFriends.map((friend) => (
                <ProfileFriendRow
                  key={friend.id}
                  friend={friend}
                  isExpanded={expandedFriend === friend.id}
                  onToggleExpand={() =>
                    setExpandedFriend(expandedFriend === friend.id ? null : friend.id)
                  }
                  onNavigate={() =>
                    navigate(`/profile/${encodeURIComponent(friend.username)}`)
                  }
                  getUserStatus={getUserStatus}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfileFriendRow({
  friend,
  isExpanded,
  onToggleExpand,
  onNavigate,
  getUserStatus,
}: {
  friend: ProfileFriend;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNavigate: () => void;
  getUserStatus: (userId: string) => import("./StatusIndicator").UserStatus;
}) {
  const { voteCounts, userVotes, totalVotes, toggleVote, loading: voteLoading } =
    useFriendVotes(isExpanded ? friend.id : undefined);

  return (
    <div>
      <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
        <div className="cursor-pointer relative" onClick={onNavigate}>
          <Avatar name={friend.username} src={friend.avatar_url || undefined} size="md" />
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusIndicator status={getUserStatus(friend.id)} size="sm" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
              onClick={onNavigate}
            >
              {friend.username}
            </span>
            {friend.is_best_friend && (
              <span className="text-yellow-500 text-xs">⭐</span>
            )}
          </div>
          {friend.status_message && (
            <p className="text-xs text-muted-foreground italic truncate">
              {friend.status_message}
            </p>
          )}
        </div>
        <button
          onClick={onToggleExpand}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-3 bg-muted/20">
          <PersonalityMeter
            voteCounts={voteCounts}
            userVotes={userVotes}
            totalVotes={totalVotes}
            onToggleVote={toggleVote}
            loading={voteLoading}
          />
        </div>
      )}
    </div>
  );
}
