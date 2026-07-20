// Top-level game picker + simple view router. Not React Router — just a
// local `view` state machine, since the whole app has one URL and the
// "screens" are really just which game component is mounted.
//
// Layout: narrow left column with the three compact game launch cards
// (plus a peek at any open Scribble lobby), wide right column with a
// combined activity feed pulled from snake_highscores + memory_highscores.
import { useState, useEffect, useCallback } from "react";
import { ScribbleLobbyList } from "./ScribbleLobbyList";
import { ScribbleGame } from "./ScribbleGame";
import { MemoryGame } from "./MemoryGame";
import { SnakeGame } from "./SnakeGame";
import { useGuestId } from "@/hooks/useGuestId";
import { useScribbleLobbies } from "@/hooks/useScribble";
import { supabase } from "@/integrations/supabase/client";

const GAMES = [
  {
    id: "memory",
    name: "Memory",
    icon: "🧠",
  },
  {
    id: "snake",
    name: "Snake",
    icon: "🐍",
  },
  {
    id: "scribble",
    name: "Scribble",
    icon: "🖌️",
  },
] as const;

interface ActivityEntry {
  id: string;
  game: "snake" | "memory";
  username: string;
  score: number;
  created_at: string;
}

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins} min sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} tim sedan`;
  const days = Math.floor(hours / 24);
  return `${days} dag${days === 1 ? "" : "ar"} sedan`;
}

interface GamesSectionProps {
  username: string | null;
}

export function GamesSection({ username }: GamesSectionProps) {
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "scribble-lobbies" | "memory" | "snake">("list");
  const guestId = useGuestId();
  const { lobbies } = useScribbleLobbies(guestId, username);

  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [topUsers, setTopUsers] = useState<{ snake: string[]; memory: string[] }>({ snake: [], memory: [] });
  const [personalBest, setPersonalBest] = useState<{ snake: number | null; memory: number | null }>({ snake: null, memory: null });

  // Supabase-js has no GROUP BY, so we fetch a wide slice ordered by score
  // and dedupe by username client-side, keeping the first (= highest)
  // score per user — that's the "MAX(score) GROUP BY username" leaderboard.
  const dedupeTopUsernames = (rows: { username: string; score: number }[]): string[] => {
    const seen = new Set<string>();
    for (const row of rows) {
      if (!seen.has(row.username)) seen.add(row.username);
      if (seen.size >= 10) break;
    }
    return Array.from(seen);
  };

  const fetchActivity = useCallback(async () => {
    const [snakeRes, memoryRes, snakeTopRes, memoryTopRes] = await Promise.all([
      supabase.from("snake_highscores").select("id,username,score,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("memory_highscores").select("id,username,score,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("snake_highscores").select("username,score").order("score", { ascending: false }).limit(200),
      supabase.from("memory_highscores").select("username,score").order("score", { ascending: false }).limit(200),
    ]);

    const snakeEntries: ActivityEntry[] = (snakeRes.data || []).map(e => ({ ...e, game: "snake" as const }));
    const memoryEntries: ActivityEntry[] = (memoryRes.data || []).map(e => ({ ...e, game: "memory" as const }));

    setActivity(
      [...snakeEntries, ...memoryEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)
    );
    setTopUsers({
      snake: dedupeTopUsernames(snakeTopRes.data || []),
      memory: dedupeTopUsernames(memoryTopRes.data || []),
    });
  }, []);

  const fetchPersonalBest = useCallback(async () => {
    if (!username) {
      setPersonalBest({ snake: null, memory: null });
      return;
    }
    const [snakeRes, memoryRes] = await Promise.all([
      supabase.from("snake_highscores").select("score").eq("username", username).order("score", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("memory_highscores").select("score").eq("username", username).order("score", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setPersonalBest({
      snake: snakeRes.data?.score ?? null,
      memory: memoryRes.data?.score ?? null,
    });
  }, [username]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    fetchPersonalBest();
  }, [fetchPersonalBest]);

  if (view === "memory") {
    return <MemoryGame onBack={() => setView("list")} username={username} />;
  }

  if (view === "snake") {
    return <SnakeGame onBack={() => setView("list")} username={username} />;
  }

  if (activeLobbyId) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <ScribbleGame lobbyId={activeLobbyId} onLeave={() => { setActiveLobbyId(null); setView("scribble-lobbies"); }} guestId={guestId} guestUsername={username} />
      </div>
    );
  }

  if (view === "scribble-lobbies") {
    return (
      <div>
        <div className="px-3 pt-2">
          <button onClick={() => setView("list")} className="retro-btn text-[10px]">
            ← Tillbaka
          </button>
        </div>
        <ScribbleLobbyList onJoinLobby={(id) => setActiveLobbyId(id)} guestId={guestId} guestUsername={username} />
      </div>
    );
  }

  const openLobby = lobbies.find(l => l.status === "waiting") || lobbies[0];
  const liveLobbyCount = lobbies.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="gs-wrapper">
        <div className="gs-inner">
          <div className="flex gap-3 items-start p-3">
            {/* Left column: compact game cards */}
            <div className="w-[200px] shrink-0 space-y-2">
              <div className="gs-tabs">
                <span className="gs-tab active">Spel</span>
              </div>

              {GAMES.map(game => {
                const playersLabel =
                  game.id === "scribble"
                    ? liveLobbyCount > 0
                      ? `${liveLobbyCount} lobby${liveLobbyCount === 1 ? "" : "s"}`
                      : "2–8"
                    : "1";
                const myBest = game.id === "snake" ? personalBest.snake : game.id === "memory" ? personalBest.memory : null;
                return (
                  <div key={game.id} className="gs-card">
                    <div className="gs-card-header">
                      <span className="truncate">{game.icon} {game.name}</span>
                      <span className="opacity-80 shrink-0">{playersLabel}</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <button
                        className="gs-play-btn"
                        onClick={
                          game.id === "memory" ? () => setView("memory") :
                          game.id === "snake" ? () => setView("snake") :
                          () => setView("scribble-lobbies")
                        }
                      >
                        ▶ Spela
                      </button>
                      {myBest != null && (
                        <p className="text-[9px] text-center" style={{ color: "#5a8aaa" }}>
                          Ditt rekord: {myBest.toLocaleString("sv-SE")}p
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Open Scribble lobby peek */}
              {openLobby && (
                <div className="space-y-1">
                  <div className="gs-section-title">Öppen lobby</div>
                  <div className="gs-lobby">
                    <div className="p-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-foreground truncate">{openLobby.title}</p>
                      <p className="text-[9px] truncate" style={{ color: "#5a8aaa" }}>
                        {openLobby.creator_username} · {openLobby.player_count || 0} spelare
                      </p>
                      <button
                        className="gs-join-btn"
                        onClick={() => setActiveLobbyId(openLobby.id)}
                      >
                        Hoppa in
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: activity feed */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="gs-tabs">
                <span className="gs-tab active">Aktivitet</span>
              </div>

              <div className="gs-card">
                <div className="p-2">
                  {lobbies.length > 0 && (
                    <div className="gs-feed-row">
                      <span className="text-[11px] truncate" style={{ color: "#d0e8f4" }}>
                        🖌️ Scribble-lobby {lobbies.some(l => l.status === "playing") ? "spelar" : "väntar"}
                      </span>
                      <span className="gs-badge gs-badge-live">Live nu</span>
                    </div>
                  )}

                  {activity.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground py-2">Inga rekord ännu — bli den första!</p>
                  ) : (
                    activity.map(entry => {
                      // Rank by the row's username against the per-user
                      // leaderboard (each user's own best score), not by
                      // this particular row's score value — a user's older,
                      // lower-scoring row still carries their current rank.
                      const rank = topUsers[entry.game].indexOf(entry.username);
                      let badge: { label: string; icon: string; className: string } | null = null;
                      if (rank === 0) {
                        badge = { label: "Guld", icon: "🥇", className: "gs-badge-gold" };
                      } else if (rank === 1) {
                        badge = { label: "Silver", icon: "🥈", className: "gs-badge-silver" };
                      } else if (rank === 2) {
                        badge = { label: "Brons", icon: "🥉", className: "gs-badge-bronze" };
                      } else if (rank >= 3) {
                        badge = { label: "Se topplistan", icon: "📊", className: "gs-badge-near" };
                      }
                      return (
                        <div key={`${entry.game}-${entry.id}`} className="gs-feed-row">
                          <span>{entry.game === "snake" ? "🐍" : "🧠"}</span>
                          <span className="gs-username font-bold text-[11px]">{entry.username}</span>
                          <span className="text-[11px]" style={{ color: "#a0c4d8" }}>· {entry.score}p</span>
                          <span className="gs-time text-[9px]">{formatRelativeTime(entry.created_at)}</span>
                          {badge && (
                            <span className={`gs-badge ${badge.className}`}>
                              {badge.icon} {badge.label}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="gs-footer text-[9px] text-center py-1.5">
            🎮 GAME ZONE
          </div>
        </div>
      </div>
    </div>
  );
}
