import { useState } from "react";
import { ScribbleLobbyList } from "./ScribbleLobbyList";
import { ScribbleGame } from "./ScribbleGame";
import { MemoryGame } from "./MemoryGame";
import { SnakeGame } from "./SnakeGame";
import { Gamepad2, User, Users, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SINGLE_PLAYER_GAMES = [
  {
    id: "memory",
    name: "Memory",
    icon: "🧠",
    description: "Hitta matchande par av kort. Klassiskt minnesspel!",
    players: "1 spelare",
    available: true,
    rules: [
      "Vänd två kort i taget för att hitta par.",
      "Matchar korten? De försvinner!",
      "Färre drag och snabbare tid = högre poäng.",
    ],
  },
  {
    id: "snake",
    name: "Snake",
    icon: "🐍",
    description: "Styr ormen och ät så mycket du kan utan att krocka.",
    players: "1 spelare",
    available: true,
    rules: [
      "Styr ormen med piltangenter eller WASD.",
      "Ät äpplen för att växa och få poäng.",
      "Undvik väggar och din egen svans!",
      "Ju fler äpplen, desto snabbare går det.",
    ],
  },
];

const MULTI_PLAYER_GAMES = [
  {
    id: "scribble",
    name: "Scribble",
    icon: "🖌️",
    description: "Rita och gissa med vänner i realtid!",
    players: "2–8 spelare",
    available: true,
    rules: [
      "En spelare ritar, resten gissar i chatten.",
      "Du får 10 poäng för rätt svar.",
      "Varje runda har en tidsgräns på 60 sekunder.",
    ],
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
        <div className="px-4 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setView("list")} className="text-muted-foreground mb-2">
            ← Tillbaka till spel
          </Button>
        </div>
        <ScribbleLobbyList onJoinLobby={(id) => setActiveLobbyId(id)} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container px-4 py-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl">Spel</h2>
            <p className="text-sm text-muted-foreground">Välj ett spel och tävla på topplistan!</p>
          </div>
        </div>

        {/* Multiplayer */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-lg">Flera spelare</h3>
          </div>
          <div className="space-y-3">
            {MULTI_PLAYER_GAMES.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onPlay={game.id === "scribble" ? () => setView("scribble-lobbies") : undefined}
              />
            ))}
          </div>
        </section>

        {/* Single player */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-lg">Enspelare</h3>
          </div>
          <div className="space-y-3">
            {SINGLE_PLAYER_GAMES.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onPlay={
                  game.id === "memory" ? () => setView("memory") :
                  game.id === "snake" ? () => setView("snake") :
                  undefined
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface GameDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  players: string;
  available: boolean;
  rules?: string[];
}

function GameCard({ game, onPlay }: { game: GameDef; onPlay?: () => void }) {
  return (
    <div className={`rounded-xl border-2 border-border bg-card overflow-hidden ${game.available ? "hover:border-primary/50" : "opacity-60"} transition-colors`}>
      <div className="bg-gradient-to-r from-primary/80 to-primary px-4 py-2 flex items-center justify-between">
        <h4 className="font-display font-bold text-sm text-primary-foreground flex items-center gap-2">
          <span className="text-lg">{game.icon}</span> {game.name}
        </h4>
        <span className="text-xs text-primary-foreground/80">{game.players}</span>
      </div>
      <div className="p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground flex-1">{game.description}</p>
        <div className="flex gap-2 shrink-0">
          {game.rules && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="font-display gap-1">
                  <BookOpen className="w-3 h-3" /> Regler
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display flex items-center gap-2">
                    <span>{game.icon}</span> Regler för {game.name}
                  </DialogTitle>
                </DialogHeader>
                <ul className="space-y-2 text-sm">
                  {game.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold">{i + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </DialogContent>
            </Dialog>
          )}
          {game.available ? (
            <Button size="sm" onClick={onPlay} className="font-display">
              Spela
            </Button>
          ) : (
            <Button size="sm" disabled className="font-display">
              Kommer snart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
