import { usePlayer } from "@/hooks/usePlayer";
import { GamesSection } from "@/components/games/GamesSection";

export default function GamesPage() {
  const { username } = usePlayer();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display font-bold text-lg text-primary">🎮 Games</h1>
          {username && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Spelar som</span>
              <span className="font-display font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                {username}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Games content */}
      <main className="flex-1 flex flex-col">
        <GamesSection username={username} />
      </main>

      {/* Footer */}
      {!username && (
        <footer className="border-t border-border bg-card/50 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Lägg till <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">?usr=DittNamn</code> i URL:en för att spara poäng
          </p>
        </footer>
      )}
    </div>
  );
}
