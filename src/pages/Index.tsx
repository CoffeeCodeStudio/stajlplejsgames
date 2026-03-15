import { usePlayer } from "@/hooks/usePlayer";
import { GamesSection } from "@/components/games/GamesSection";

export default function GamesPage() {
  const { username } = usePlayer();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top navigation bar */}
      <header className="retro-nav">
        <span className="retro-nav-item active">🎮 SPEL</span>
        <span className="retro-nav-item">🏆 TOPPLISTA</span>
        {username && (
          <span className="retro-nav-item ml-auto" style={{ cursor: 'default' }}>
            👤 {username}
          </span>
        )}
      </header>

      {/* Sub header */}
      <div className="bg-[hsl(222_40%_14%)] border-b-2 border-border px-4 py-2 flex items-center justify-between">
        <h1 className="font-pixel text-xs text-primary text-shadow-retro tracking-wider">
          GAME ZONE
        </h1>
        {username ? (
          <span className="text-xs text-muted-foreground">
            Inloggad som: <strong className="text-foreground">{username}</strong>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Gäst — lägg till <code className="text-primary">?usr=Namn</code> i URL:en
          </span>
        )}
      </div>

      {/* Games content */}
      <main className="flex-1 flex flex-col">
        <GamesSection username={username} />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-[hsl(222_40%_10%)] py-2 text-center">
        <p className="text-[10px] text-muted-foreground font-pixel">
          © 2026 GAME ZONE · RETRO EDITION
        </p>
      </footer>
    </div>
  );
}
