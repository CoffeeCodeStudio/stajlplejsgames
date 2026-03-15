import { useState, useEffect } from "react";
import { Users, UserPlus, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../Avatar";
import { StatusIndicator } from "../StatusIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InviteToCallDialogProps {
  currentParticipants: string[];
  maxParticipants: number;
  onInvite: (userId: string) => void;
  onClose: () => void;
}

interface FriendInfo {
  id: string;
  userId: string;
  name: string;
  status: "online" | "offline";
}

export function InviteToCallDialog({ currentParticipants, maxParticipants, onInvite, onClose }: InviteToCallDialogProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const loadFriends = async () => {
      const { data } = await supabase
        .from("friends")
        .select("friend_id, user_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (!data) { setLoading(false); return; }

      const friendIds = data.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));
      const alreadyIn = new Set([user.id, ...currentParticipants]);
      const available = friendIds.filter((id) => !alreadyIn.has(id));

      if (available.length === 0) { setFriends([]); setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, last_seen")
        .in("user_id", available);

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      setFriends(
        (profiles || []).map((p) => ({
          id: p.user_id,
          userId: p.user_id,
          name: p.username,
          status: (p.last_seen && p.last_seen > fiveMinAgo ? "online" : "offline") as "online" | "offline",
        }))
      );
      setLoading(false);
    };
    loadFriends();
  }, [user, currentParticipants]);

  const handleInvite = (userId: string) => {
    onInvite(userId);
    setInvitedIds((prev) => new Set(prev).add(userId));
  };

  const spotsLeft = maxParticipants - 1 - currentParticipants.length;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-[#2d5aa0] to-[#1e4c8a] rounded-xl shadow-2xl border border-white/10 max-w-sm w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4" />
            <span className="font-bold text-sm">Bjud in till samtal</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3">
          <p className="text-[11px] text-white/60 mb-3">{spotsLeft} platser kvar (max {maxParticipants} deltagare)</p>
          
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-center text-white/40 text-sm py-6">Inga tillgängliga vänner att bjuda in</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar name={friend.name} size="sm" />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusIndicator status={friend.status} size="sm" />
                      </div>
                    </div>
                    <span className="text-white text-sm">{friend.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={invitedIds.has(friend.id) || spotsLeft <= 0}
                    className="text-white/80 hover:text-white hover:bg-white/20 text-xs"
                    onClick={() => handleInvite(friend.id)}
                  >
                    {invitedIds.has(friend.id) ? (
                      <span className="text-green-400">Inbjuden ✓</span>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Bjud in
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
