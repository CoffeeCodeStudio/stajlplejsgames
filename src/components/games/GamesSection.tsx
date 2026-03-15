import { useState } from "react";
import { ScribbleLobbyList } from "./ScribbleLobbyList";
import { ScribbleGame } from "./ScribbleGame";
import { MemoryGame } from "./MemoryGame";
import { SnakeGame } from "./SnakeGame";

const GAMES = [
  {
    id: "memory",
    name: "Memory",
    icon: "🧠",
    description: "Hitta matchande par av kort.",
    players: "1 spelare",
  },
  {
    id: "snake",
    name: "Snake",
    icon: "🐍",
    description: "Styr ormen och ät äpplen.",
    players: "1 spelare",
  },
  {
    id: "scribble",
    name: "Scribble",
    icon: "🖌️",
    description: "Rita och gissa med vänner!",
    players: "2–8 spelare",
  },
];

interface GamesSectionProps {
  username: string | null;
}

export function GamesSection({ username }: GamesSectionProps) {
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "scribble-lobbies" | "memory" | "snake">("list");

  if (view === "memory") {
    return <MemoryGame onBack={() => setView("list")} username={username} />;
  }

  if (view === "snake") {
    return <SnakeGame onBack={() => setView("list")} username={username} />;
  }

  if (activeLobbyId) {
    return <ScribbleGame lobbyId={activeLobbyId} onLeave={() => { setActiveLobbyId(null); setView("scribble-lobbies"); }} />;
  }

  if (view === "scribble-lobbies") {
    return (
      <div>
        <div className="px-3 pt-2">
          <button onClick={() => setView("list")} className="retro-btn text-[10px]">
            ← Tillbaka
          </button>
        </div>
        <ScribbleLobbyList onJoinLobby={(id) => setActiveLobbyId(id)} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 py-4 space-y-3">
        {GAMES.map(game => (
          <div key={game.id} className="retro-panel">
            <div className="retro-panel-header flex items-center justify-between">
              <span>{game.icon} {game.name}</span>
              <span style={{ fontFamily: 'Tahoma, sans-serif', fontSize: 9, fontWeight: 'normal', textTransform: 'none' }}>
                {game.players}
              </span>
            </div>
            <div className="retro-panel-body flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground flex-1">{game.description}</p>
              <button
                className="retro-btn retro-btn-primary text-[10px]"
                onClick={
                  game.id === "memory" ? () => setView("memory") :
                  game.id === "snake" ? () => setView("snake") :
                  game.id === "scribble" ? () => setView("scribble-lobbies") :
                  undefined
                }
              >
                ▶ SPELA
              </button>
            </div>
          </div>
        ))}

        {!username && (
          <div className="retro-panel">
            <div className="retro-panel-header text-[8px]">💡 Tips</div>
            <div className="retro-panel-body text-[10px] text-muted-foreground text-center">
              Lägg till <code className="text-primary bg-background px-1">?usr=DittNamn</code> i URL:en för att spara poäng
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
