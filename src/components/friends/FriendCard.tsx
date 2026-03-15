import { useState } from "react";
import { MessageSquare, Star, UserMinus, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Avatar } from "../Avatar";
import { StatusIndicator, type UserStatus } from "../StatusIndicator";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PersonalityMeter } from "../PersonalityMeter";
import { useFriendVotes } from "@/hooks/useFriendVotes";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const FRIEND_CATEGORIES = [
  'Nätvän', 'Polare', 'Granne', 'Pussgurka', 'Kollega', 'Klasskamrat', 'Beundrare',
] as const;

export type FriendCategory = (typeof FRIEND_CATEGORIES)[number];

export interface FriendData {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
  isBestFriend: boolean;
  friendshipId: string;
  friendshipStatus: string;
  isIncoming: boolean;
  category: FriendCategory;
}

interface FriendCardProps {
  friend: FriendData;
  isLoggedOut: boolean;
  actionLoading: string | null;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
  onToggleBestFriend: (friendshipId: string, current: boolean) => void;
  onRemove: (friendshipId: string) => void;
  onSendMessage?: (userId: string) => void;
}

export function FriendCard({
  friend,
  isLoggedOut,
  actionLoading,
  onAccept,
  onReject,
  onToggleBestFriend,
  onRemove,
  onSendMessage,
}: FriendCardProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { voteCounts, userVotes, totalVotes, toggleVote, loading: voteLoading } = useFriendVotes(friend.id);

  const handleCategoryChange = async (newCategory: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ category: newCategory })
        .eq('id', friend.friendshipId);

      if (error) throw error;

      toast({ title: `Kategori ändrad till ${newCategory}` });
    } catch (err) {
      console.error('Error updating category:', err);
      toast({ title: 'Kunde inte ändra kategori', variant: 'destructive' });
    }
  };

  const isPending = friend.friendshipStatus === 'pending' && friend.isIncoming;

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
        >
          <Avatar name={friend.name} src={friend.avatar} status={friend.status} size="md" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
            >
              {friend.name}
            </span>
            {friend.isBestFriend && (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {friend.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusIndicator status={friend.status} size="sm" />
            <span className="text-xs text-muted-foreground">
              {friend.status === 'online' ? 'online' : friend.status === 'away' ? 'borta' : 'offline'}
            </span>
          </div>
          {friend.statusMessage && (
            <p className="text-[10px] text-muted-foreground/70 truncate italic">
              {friend.statusMessage}
            </p>
          )}
        </div>

        {isPending ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
              onClick={() => onAccept(friend.friendshipId)}
              disabled={actionLoading === friend.friendshipId}
            >
              {actionLoading === friend.friendshipId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-lg">✓</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={() => onReject(friend.friendshipId)}
              disabled={actionLoading === friend.friendshipId}
            >
              <span className="text-lg">✕</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isLoggedOut}
              onClick={() => onSendMessage?.(friend.id)}
              title="Skicka meddelande"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", friend.isBestFriend && "text-yellow-500")}
              disabled={isLoggedOut}
              onClick={() => onToggleBestFriend(friend.friendshipId, friend.isBestFriend)}
              title={friend.isBestFriend ? "Ta bort som bästis" : "Markera som bästis"}
            >
              <Star className={cn("w-4 h-4", friend.isBestFriend && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={isLoggedOut}
              onClick={() => onRemove(friend.friendshipId)}
              title="Ta bort vän"
            >
              <UserMinus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
              title="Visa mer"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Expanded section with category picker & personality meter */}
      {expanded && !isPending && (
        <div className="px-4 pb-4 pt-1 space-y-3 bg-muted/20">
          {/* Category selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Kategori:</span>
            <Select
              defaultValue={friend.category}
              onValueChange={handleCategoryChange}
              disabled={isLoggedOut}
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRIEND_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personality Meter */}
          <PersonalityMeter
            voteCounts={voteCounts}
            userVotes={userVotes}
            totalVotes={totalVotes}
            onToggleVote={toggleVote}
            disabled={isLoggedOut}
            loading={voteLoading}
          />
        </div>
      )}
    </div>
  );
}
