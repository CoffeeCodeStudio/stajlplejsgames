import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, Newspaper, Users, TrendingUp, Bot, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LajvMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message: string;
  created_at: string;
}

interface BotProfile {
  user_id: string;
  username: string;
  is_bot: boolean;
  last_seen: string | null;
}

interface BotSetting {
  user_id: string;
  name: string;
  tone_of_voice: string;
  is_active: boolean;
}

const PERSONALITY_LABELS: Record<string, { label: string; color: string }> = {
  nostalgikern: { label: "Nostalgikern", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  kortansen: { label: "Kortansen", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  gladansen: { label: "Gladansen", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  dramansen: { label: "Dramansen", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  filosofansen: { label: "Filosofansen", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

export function AdminBotActivity() {
  const [botLajv, setBotLajv] = useState<LajvMessage[]>([]);
  const [botSettings, setBotSettings] = useState<BotSetting[]>([]);
  const [botProfiles, setBotProfiles] = useState<BotProfile[]>([]);
  const [guestbookActivity, setGuestbookActivity] = useState<Array<{ id: string; author_name: string; message: string; created_at: string; profile_owner_id: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const [settingsRes, profilesRes, lajvRes, gbRes] = await Promise.all([
      supabase.from("bot_settings").select("user_id, name, tone_of_voice, is_active"),
      supabase.from("profiles").select("user_id, username, is_bot, last_seen").eq("is_bot", true),
      supabase.from("lajv_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profile_guestbook").select("id, author_name, message, created_at, profile_owner_id").order("created_at", { ascending: false }).limit(50),
    ]);

    if (settingsRes.data) setBotSettings(settingsRes.data as BotSetting[]);
    if (profilesRes.data) setBotProfiles(profilesRes.data as BotProfile[]);

    const botUserIds = new Set((settingsRes.data || []).map((b: BotSetting) => b.user_id));
    const botNames = new Set((settingsRes.data || []).map((b: BotSetting) => b.name));

    // Filter lajv to only bot messages
    if (lajvRes.data) {
      setBotLajv(lajvRes.data.filter((m: LajvMessage) => botUserIds.has(m.user_id)));
    }

    // Filter guestbook to bot-authored entries
    if (gbRes.data) {
      setGuestbookActivity(gbRes.data.filter((e) => botNames.has(e.author_name)));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Real-time subscription for new bot lajv messages
    const channel = supabase
      .channel("admin-bot-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lajv_messages" }, (payload) => {
        const msg = payload.new as LajvMessage;
        const botUserIds = new Set(botSettings.map((b) => b.user_id));
        if (botUserIds.has(msg.user_id)) {
          setBotLajv((prev) => [msg, ...prev].slice(0, 50));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profile_guestbook" }, (payload) => {
        const entry = payload.new as { id: string; author_name: string; message: string; created_at: string; profile_owner_id: string };
        const botNames = new Set(botSettings.map((b) => b.name));
        if (botNames.has(entry.author_name)) {
          setGuestbookActivity((prev) => [entry, ...prev].slice(0, 50));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Compute personality stats
  const botUserIds = new Set(botSettings.map((b) => b.user_id));
  const personalityStats = botSettings.reduce<Record<string, { total: number; active: number; lajvCount: number }>>((acc, bot) => {
    const p = bot.tone_of_voice || "nostalgikern";
    if (!acc[p]) acc[p] = { total: 0, active: 0, lajvCount: 0 };
    acc[p].total++;
    if (bot.is_active) acc[p].active++;
    return acc;
  }, {});

  // Count lajv per personality
  for (const msg of botLajv) {
    const bot = botSettings.find((b) => b.user_id === msg.user_id);
    if (bot) {
      const p = bot.tone_of_voice || "nostalgikern";
      if (personalityStats[p]) personalityStats[p].lajvCount++;
    }
  }

  // Detect cross-bot interactions (bot replying to another bot in lajv)
  const crossBotMessages = botLajv.filter((msg) => {
    const mentionsBot = botSettings.some(
      (b) => b.user_id !== msg.user_id && msg.message.toLowerCase().includes(b.name.toLowerCase())
    );
    return mentionsBot;
  });

  // Online count
  const now = new Date();
  const onlineBots = botProfiles.filter((p) => {
    if (!p.last_seen) return false;
    return (now.getTime() - new Date(p.last_seen).getTime()) < 5 * 60 * 1000;
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Bot} label="Bottar online" value={`${onlineBots.length}/${botProfiles.length}`} />
        <StatCard icon={MessageCircle} label="Bot-lajv (senaste)" value={String(botLajv.length)} />
        <StatCard icon={Zap} label="Cross-bot" value={String(crossBotMessages.length)} />
        <StatCard icon={Newspaper} label="Gästboksinlägg" value={String(guestbookActivity.length)} />
      </div>

      {/* Personality breakdown */}
      <div className="nostalgia-card p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Personlighetstyper — Aktivitet
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(personalityStats)
            .sort((a, b) => b[1].lajvCount - a[1].lajvCount)
            .map(([personality, stats]) => {
              const meta = PERSONALITY_LABELS[personality] || { label: personality, color: "bg-muted text-muted-foreground" };
              return (
                <div key={personality} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{stats.active}/{stats.total} aktiva</span>
                    <span className="font-mono text-foreground">{stats.lajvCount} lajv</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Two-column: Cross-bot interactions + News reactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cross-bot interactions */}
        <div className="nostalgia-card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Cross-bot interaktioner
          </h3>
          <ScrollArea className="h-[300px]">
            {crossBotMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Inga cross-bot-interaktioner ännu</p>
            ) : (
              <div className="space-y-2">
                {crossBotMessages.map((msg) => {
                  const bot = botSettings.find((b) => b.user_id === msg.user_id);
                  const personality = bot?.tone_of_voice || "nostalgikern";
                  const meta = PERSONALITY_LABELS[personality] || { label: personality, color: "" };
                  return (
                    <div key={msg.id} className="p-2 rounded bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs">{msg.username}</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${meta.color}`}>{meta.label}</Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{msg.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* All bot lajv feed */}
        <div className="nostalgia-card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Bot-lajvflöde (realtid)
          </h3>
          <ScrollArea className="h-[300px]">
            {botLajv.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Inga bot-lajv ännu</p>
            ) : (
              <div className="space-y-2">
                {botLajv.slice(0, 20).map((msg) => {
                  const bot = botSettings.find((b) => b.user_id === msg.user_id);
                  const personality = bot?.tone_of_voice || "nostalgikern";
                  const meta = PERSONALITY_LABELS[personality] || { label: personality, color: "" };
                  const isCrossBot = crossBotMessages.some((m) => m.id === msg.id);
                  return (
                    <div key={msg.id} className={`p-2 rounded border ${isCrossBot ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border/30"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs">{msg.username}</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${meta.color}`}>{meta.label}</Badge>
                        {isCrossBot && <Badge variant="outline" className="text-[10px] px-1 py-0 bg-primary/20 text-primary border-primary/30">cross-bot</Badge>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{msg.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Bot guestbook activity */}
      <div className="nostalgia-card p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          Bot-gästboksaktivitet
        </h3>
        <ScrollArea className="h-[200px]">
          {guestbookActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Inga bot-gästboksinlägg</p>
          ) : (
            <div className="space-y-2">
              {guestbookActivity.slice(0, 15).map((entry) => {
                const bot = botSettings.find((b) => b.name === entry.author_name);
                const personality = bot?.tone_of_voice || "nostalgikern";
                const meta = PERSONALITY_LABELS[personality] || { label: personality, color: "" };
                return (
                  <div key={entry.id} className="p-2 rounded bg-muted/20 border border-border/30 flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs">{entry.author_name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${meta.color}`}>{meta.label}</Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(entry.created_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="nostalgia-card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
