import { useState, useEffect } from "react";
import { Loader2, Users } from "lucide-react";
import { Avatar } from "../Avatar";
import { StatusIndicator, type UserStatus } from "../StatusIndicator";
import { supabase } from "@/integrations/supabase/client";
import { usePresence } from "@/hooks/usePresence";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MemberProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  last_seen?: string | null;
  is_bot?: boolean;
  gender?: string | null;
}

type GenderFilter = "alla" | "kille" | "tjej";

export function MemberGrid() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("alla");
  const { getUserStatus, onlineUsers } = usePresence();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, last_seen, is_bot, gender")
        .order("created_at", { ascending: false });

      if (!error && data) setMembers(data);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const BOT_ONLINE_THRESHOLD_MS = 8 * 60 * 1000;
  const statusOrder: Record<UserStatus, number> = { online: 0, away: 1, busy: 2, offline: 3 };

  const getMemberStatus = (m: MemberProfile): UserStatus => {
    if (m.is_bot && m.last_seen) {
      const age = Date.now() - new Date(m.last_seen).getTime();
      if (age < BOT_ONLINE_THRESHOLD_MS) return "online";
      return "offline";
    }
    return getUserStatus(m.user_id);
  };

  const filteredMembers = members.filter((m) => {
    if (genderFilter === "alla") return true;
    const g = (m.gender || "").toLowerCase();
    if (genderFilter === "kille") return g === "kille" || g === "man" || g === "pojke";
    if (genderFilter === "tjej") return g === "tjej" || g === "kvinna" || g === "flicka";
    return true;
  });

  const sortedMembers = [...filteredMembers]
    .map((m) => ({ ...m, _status: getMemberStatus(m) }))
    .sort((a, b) => {
      const diff = statusOrder[a._status] - statusOrder[b._status];
      if (diff !== 0) return diff;
      const aTime = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const bTime = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      if (a._status === "online" || a._status === "away") return aTime - bTime;
      return bTime - aTime;
    });

  const onlineCount = sortedMembers.filter(
    (m) => m._status === "online" || m._status === "away"
  ).length;

  const filterButtons: { id: GenderFilter; label: string; emoji: string }[] = [
    { id: "alla", label: "Alla", emoji: "👥" },
    { id: "tjej", label: "Tjejer", emoji: "👧" },
    { id: "kille", label: "Killar", emoji: "👦" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="container px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl">Alla Medlemmar</h1>
            <p className="text-sm text-muted-foreground">
              {onlineCount} online av {filteredMembers.length} medlemmar
            </p>
          </div>
        </div>

        {/* Gender filter */}
        <div className="flex gap-2 mb-6">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setGenderFilter(btn.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                genderFilter === btn.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {btn.emoji} {btn.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
          {sortedMembers.map((member) => (
            <button
              key={member.user_id}
              onClick={() => navigate(`/profile/${encodeURIComponent(member.username)}`)}
              className="nostalgia-card p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-all hover:-translate-y-0.5"
            >
              <div className="relative">
                <Avatar name={member.username} src={member.avatar_url} size="lg" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <StatusIndicator status={member._status} size="md" />
                </div>
              </div>
              <span className="text-sm font-medium truncate w-full text-center">
                {member.username}
              </span>
            </button>
          ))}
        </div>

        {sortedMembers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Inga medlemmar hittades.</p>
          </div>
        )}
      </div>
    </div>
  );
}
