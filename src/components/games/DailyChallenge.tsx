/**
 * @module DailyChallenge
 * Shows a daily drawing challenge prompt in the Scribble game.
 * Challenges rotate daily based on the date. Includes gamification
 * with Good Vibe tokens for winners.
 */
import { useState, useMemo } from "react";
import { Sparkles, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHALLENGES = [
  { theme: "Rita en MSN-gubbe", emoji: "🤖", difficulty: "Lätt" },
  { theme: "Rita din första mobil", emoji: "📱", difficulty: "Medel" },
  { theme: "Rita en LunarStorm-profil", emoji: "⭐", difficulty: "Svår" },
  { theme: "Rita din favorit-emoji", emoji: "😎", difficulty: "Lätt" },
  { theme: "Rita ett klassiskt datorspel", emoji: "🎮", difficulty: "Medel" },
  { theme: "Rita en diskettstation", emoji: "💾", difficulty: "Svår" },
  { theme: "Rita Internet Explorer-loggan", emoji: "🌐", difficulty: "Medel" },
  { theme: "Rita en Tamagotchi", emoji: "🥚", difficulty: "Lätt" },
  { theme: "Rita MSN Messenger-loggan", emoji: "🦋", difficulty: "Medel" },
  { theme: "Rita en Nokia 3310", emoji: "📞", difficulty: "Lätt" },
  { theme: "Rita Clippy från Microsoft", emoji: "📎", difficulty: "Medel" },
  { theme: "Rita en Game Boy", emoji: "🕹️", difficulty: "Lätt" },
  { theme: "Rita en pixelhjärta", emoji: "💗", difficulty: "Lätt" },
  { theme: "Rita Windows XP-kullen", emoji: "🏔️", difficulty: "Svår" },
];

function getDailyChallenge() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return CHALLENGES[dayOfYear % CHALLENGES.length];
}

const difficultyColors: Record<string, string> = {
  Lätt: "text-online",
  Medel: "text-primary",
  Svår: "text-destructive",
};

export function DailyChallenge() {
  const [dismissed, setDismissed] = useState(false);
  const challenge = useMemo(() => getDailyChallenge(), []);

  if (dismissed) return null;

  return (
    <div className="glass-card p-4 relative animate-kinetic-slide-up">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 text-muted-foreground"
        aria-label="Stäng"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="text-3xl">{challenge.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">Dagens Utmaning</h3>
          </div>
          <p className="text-sm text-foreground font-medium">{challenge.theme}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-bold ${difficultyColors[challenge.difficulty] || "text-muted-foreground"}`}>
              {challenge.difficulty}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Trophy className="w-3 h-3" /> +5 Good Vibes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Game-over card with Good Vibe award button.
 */
export function GameOverVibes({
  winnerId,
  winnerName,
  onGiveVibe,
  hasVibed,
}: {
  winnerId: string;
  winnerName: string;
  onGiveVibe: () => void;
  hasVibed: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-2 border-t border-border mt-3">
      <span className="text-xs text-muted-foreground">
        Ge {winnerName} en Good Vibe:
      </span>
      <Button
        size="sm"
        variant={hasVibed ? "secondary" : "default"}
        onClick={onGiveVibe}
        disabled={hasVibed}
        className="h-7 text-xs gap-1 pressable"
      >
        {hasVibed ? "✨ Skickat!" : "✨ Good Vibe"}
      </Button>
    </div>
  );
}
