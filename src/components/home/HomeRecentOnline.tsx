import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { Avatar } from "../Avatar";
import { StatusIndicator } from "../StatusIndicator";
import type { UserStatus } from "../StatusIndicator";
import { Users } from "lucide-react";
import { BentoCard } from "./BentoCard";

const BOT_ONLINE_THRESHOLD_MS = 8 * 60 * 1000; // 8 min

export function HomeRecentOnline() {
  const [members, setMembers] = useState<{ user_id: string; username: string; avatar_url: string | null; is_bot?: boolean; last_seen?: string | null }[]>([]);
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, is_bot, last_seen")
          .order("last_seen", { ascending: false })
          .limit(10);
        if (data) setMembers(data);
      } else {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-stats`,
            { headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.recentMembers) setMembers(data.recentMembers);
          }
        } catch {}
      }
    };
    fetchRecent();
  }, [user]);

  const getMemberStatus = (m: typeof members[0]): UserStatus => {
    // For bots, derive status from last_seen
    if (m.is_bot && m.last_seen) {
      const age = Date.now() - new Date(m.last_seen).getTime();
      if (age < BOT_ONLINE_THRESHOLD_MS) return "online";
      return "offline";
    }
    return getUserStatus(m.user_id);
  };

  // Sort: online first (by longest session / earliest last_seen), then away, then others
  const statusOrder: Record<UserStatus, number> = { online: 0, away: 1, busy: 2, offline: 3 };

  const sortedMembers = [...members]
    .map((m) => ({ ...m, _status: getMemberStatus(m) }))
    .sort((a, b) => {
      const diff = statusOrder[a._status] - statusOrder[b._status];
      if (diff !== 0) return diff;
      // Within same status, longest online first (earliest last_seen)
      const aTime = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const bTime = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      if (a._status === "online" || a._status === "away") return aTime - bTime; // earliest = longest
      return bTime - aTime; // offline: most recent first
    });

  return (
    <BentoCard title="Senaste Inloggade" icon={<Users className="w-4 h-4" />}>
      {sortedMembers.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Inga medlemmar ännu</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {sortedMembers.map((m) => (
            <button
              key={m.user_id}
              onClick={() => navigate(`/profile/${encodeURIComponent(m.username)}`)}
              className="pressable flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-muted/30 transition-colors min-h-[44px]"
            >
              <div className="relative">
                <Avatar name={m.username} src={m.avatar_url} size="sm" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <StatusIndicator status={m._status} size="sm" />
                </div>
              </div>
              <span className="text-[10px] truncate w-full text-center text-muted-foreground">{m.username}</span>
            </button>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
