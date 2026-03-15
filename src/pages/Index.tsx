import { usePlayer } from "@/hooks/usePlayer";
import { GamesSection } from "@/components/games/GamesSection";

export default function GamesPage() {
  const { username } = usePlayer();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-[500px] mx-auto">
      {/* Top navigation bar */}
      <header className="retro-nav text-[9px]">
        <span className="retro-nav-item active">🎮 SPEL</span>
        <span className="retro-nav-item">🏆 TOPPLISTA</span>
        {username && (
          <span className="retro-nav-item ml-auto" style={{ cursor: 'default' }}>
            👤 {username}
          </span>
        )}
      </header>

      {/* Sub header */}
      <div className="bg-card border-b-2 border-border px-3 py-2 flex items-center justify-between">
        <h1 className="font-pixel text-[10px] text-primary text-shadow-retro tracking-wider">
          GAME ZONE
        </h1>
        {username ? (
          <span className="text-xs text-muted-foreground">
            Inloggad: <strong className="text-foreground">{username}</strong>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Gäst — <code className="text-primary">?usr=Namn</code>
          </span>
        )}
      </div>

      {/* Games content */}
      <main className="flex-1 flex flex-col">
        <GamesSection username={username} />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-muted py-1.5 text-center space-y-0.5">
        <p className="text-[9px] text-muted-foreground font-pixel">
          © 2026 GAME ZONE
        </p>
        <a 
          href="https://coffeecodestudio.se" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[8px] text-primary/80 hover:text-primary font-pixel block"
        >
          Powered by Coffee Code Studio
        </a>
      </footer>
    </div>
  );
}
