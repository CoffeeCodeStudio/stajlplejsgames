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
  const [bestScores, setBestScores] = useState<{ snake: number; memory: number }>({ snake: 0, memory: 0 });
  const [personalBest, setPersonalBest] = useState<{ snake: number | null; memory: number | null }>({ snake: null, memory: null });

  const fetchActivity = useCallback(async () => {
    const [snakeRes, memoryRes, snakeBestRes, memoryBestRes] = await Promise.all([
      supabase.from("snake_highscores").select("id,username,score,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("memory_highscores").select("id,username,score,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("snake_highscores").select("score").order("score", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("memory_highscores").select("score").order("score", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const snakeEntries: ActivityEntry[] = (snakeRes.data || []).map(e => ({ ...e, game: "snake" as const }));
    const memoryEntries: ActivityEntry[] = (memoryRes.data || []).map(e => ({ ...e, game: "memory" as const }));

    setActivity(
      [...snakeEntries, ...memoryEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)
    );
    setBestScores({
      snake: snakeBestRes.data?.score ?? 0,
      memory: memoryBestRes.data?.score ?? 0,
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
      <div className="px-3 py-4 flex gap-3 items-start">
        {/* Left column: compact game cards */}
        <div className="w-32 shrink-0 space-y-2">
          {GAMES.map(game => {
            const playersLabel =
              game.id === "scribble"
                ? liveLobbyCount > 0
                  ? `${liveLobbyCount} lobby${liveLobbyCount === 1 ? "" : "s"}`
                  : "2–8"
                : "1";
            const myBest = game.id === "snake" ? personalBest.snake : game.id === "memory" ? personalBest.memory : null;
            return (
              <div key={game.id} className="retro-panel">
                <div className="retro-panel-header !text-[7px] !px-2 !py-1 flex items-center justify-between gap-1">
                  <span className="truncate">{game.icon} {game.name}</span>
                  <span className="opacity-80 shrink-0">{playersLabel}</span>
                </div>
                <div className="retro-panel-body !p-1.5 space-y-1">
                  <button
                    className="retro-btn retro-btn-primary text-[9px] w-full"
                    onClick={
                      game.id === "memory" ? () => setView("memory") :
                      game.id === "snake" ? () => setView("snake") :
                      () => setView("scribble-lobbies")
                    }
                  >
                    ▶ Spela
                  </button>
                  {myBest != null && (
                    <p className="text-[9px] text-muted-foreground text-center">
                      Ditt rekord: {myBest.toLocaleString("sv-SE")}p
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Open Scribble lobby peek */}
          {openLobby && (
            <div className="retro-panel">
              <div className="retro-panel-header !text-[7px] !px-2 !py-1">
                Öppen lobby
              </div>
              <div className="retro-panel-body !p-1.5 space-y-1">
                <p className="text-[10px] font-bold text-foreground truncate">{openLobby.title}</p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {openLobby.creator_username} · {openLobby.player_count || 0} spelare
                </p>
                <button
                  className="retro-btn retro-btn-primary text-[9px] w-full"
                  onClick={() => setActiveLobbyId(openLobby.id)}
                >
                  Hoppa in
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: activity feed */}
        <div className="flex-1 min-w-0">
          <div className="retro-panel">
            <div className="retro-panel-header flex items-center justify-between">
              <span>📊 Aktivitet</span>
            </div>
            <div className="retro-panel-body space-y-2">
              {lobbies.length > 0 && (
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <span className="text-[11px] text-foreground truncate">
                    🖌️ Scribble-lobby {lobbies.some(l => l.status === "playing") ? "spelar" : "väntar"}
                  </span>
                  <span className="text-[8px] font-pixel px-1.5 py-0.5 shrink-0" style={{ background: "hsl(var(--online-green))", color: "#fff" }}>
                    Live nu
                  </span>
                </div>
              )}

              {activity.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Inga rekord ännu — bli den första!</p>
              ) : (
                activity.map(entry => {
                  const best = bestScores[entry.game];
                  let badge: { label: string; icon: string; bg: string; fg: string } | null = null;
                  if (best > 0) {
                    if (entry.score > best) {
                      badge = { label: "Nytt rekord", icon: "🥇", bg: "hsl(45 90% 55%)", fg: "#000" };
                    } else if (entry.score === best) {
                      badge = { label: "Lika rekord", icon: "🤝", bg: "hsl(50 95% 60%)", fg: "#000" };
                    } else if (entry.score >= best * 0.85) {
                      badge = { label: "Nära rekord", icon: "⚡", bg: "hsl(210 80% 55%)", fg: "#fff" };
                    }
                  }
                  return (
                    <div key={`${entry.game}-${entry.id}`} className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-foreground truncate">
                          {entry.game === "snake" ? "🐍" : "🧠"} <strong>{entry.username}</strong>
                          <span className="text-muted-foreground"> · {entry.score}p</span>
                        </p>
                        <p className="text-[9px] text-muted-foreground">{formatRelativeTime(entry.created_at)}</p>
                      </div>
                      {badge && (
                        <span className="text-[8px] font-pixel px-1.5 py-0.5 shrink-0" style={{ background: badge.bg, color: badge.fg }}>
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
    </div>
  );
}
