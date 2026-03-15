import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, RotateCcw, Trophy, Clock, MousePointerClick, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PIXEL_EMOJIS = [
  "🎮", "👾", "🕹️", "🤖", "💾", "📟", "🌟", "🎵",
  "🐱", "🐶", "🦊", "🐸", "🍕", "🚀", "⚡", "🔥",
];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: number; label: string }> = {
  easy: { pairs: 6, cols: 4, label: "Lätt (6 par)" },
  medium: { pairs: 8, cols: 4, label: "Medium (8 par)" },
  hard: { pairs: 12, cols: 6, label: "Svårt (12 par)" },
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs: number): Card[] {
  const emojis = shuffleArray(PIXEL_EMOJIS).slice(0, pairs);
  const cards = emojis.flatMap((emoji, i) => [
    { id: i * 2, emoji, flipped: false, matched: false },
    { id: i * 2 + 1, emoji, flipped: false, matched: false },
  ]);
  return shuffleArray(cards);
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function calcScore(moves: number, seconds: number, pairs: number): number {
  const base = pairs * 100;
  const movePenalty = Math.max(0, (moves - pairs) * 5);
  const timePenalty = Math.floor(seconds / 2);
  return Math.max(0, base - movePenalty - timePenalty);
}

interface HighscoreEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  moves: number;
  time_seconds: number;
  difficulty: string;
  created_at: string;
}

interface Props {
  onBack: () => void;
  username: string | null;
}

export function MemoryGame({ onBack, username }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<HighscoreEntry[]>([]);
  const [leaderboardDiff, setLeaderboardDiff] = useState<Difficulty>("medium");
  const [scoreSaved, setScoreSaved] = useState(false);
  const [bestScores, setBestScores] = useState<Record<Difficulty, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem("memory-best") || "{}");
    } catch { return {} as Record<Difficulty, number>; }
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false);

  const totalPairs = difficulty ? DIFFICULTY_CONFIG[difficulty].pairs : 0;

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCards(buildDeck(DIFFICULTY_CONFIG[diff].pairs));
    setFlippedIds([]);
    setMoves(0);
    setMatchedPairs(0);
    setSeconds(0);
    setGameOver(false);
    setScoreSaved(false);
    lockRef.current = false;
  }, []);

  const fetchLeaderboard = useCallback(async (diff: Difficulty) => {
    const { data } = await supabase
      .from('memory_highscores')
      .select('*')
      .eq('difficulty', diff)
      .order('score', { ascending: false })
      .limit(20);
    setLeaderboard((data as HighscoreEntry[]) || []);
  }, []);

  const saveScore = useCallback(async (score: number, movesCount: number, timeSec: number, diff: Difficulty) => {
    if (!username || scoreSaved) return;
    setScoreSaved(true);
    await supabase.from('memory_highscores').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      username: username,
      avatar_url: null,
      score,
      moves: movesCount,
      time_seconds: timeSec,
      difficulty: diff,
    });
  }, [username, scoreSaved]);

  // Timer
  useEffect(() => {
    if (difficulty && !gameOver) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [difficulty, gameOver]);

  // Check win
  useEffect(() => {
    if (totalPairs > 0 && matchedPairs === totalPairs) {
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const score = calcScore(moves, seconds, totalPairs);
      if (difficulty) {
        const prev = bestScores[difficulty] || 0;
        if (score > prev) {
          const next = { ...bestScores, [difficulty]: score };
          setBestScores(next);
          localStorage.setItem("memory-best", JSON.stringify(next));
        }
        saveScore(score, moves, seconds, difficulty);
        fetchLeaderboard(difficulty);
      }
    }
  }, [matchedPairs, totalPairs]); // eslint-disable-line

  const handleCardClick = (id: number) => {
    if (lockRef.current || gameOver) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (flippedIds.includes(id)) return;

    const newFlipped = [...flippedIds, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      lockRef.current = true;
      const [a, b] = newFlipped;
      const cardA = cards.find(c => c.id === a)!;
      const emojiB = card.emoji;

      if (cardA.emoji === emojiB) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, matched: true, flipped: true } : c
          ));
          setMatchedPairs(p => p + 1);
          setFlippedIds([]);
          lockRef.current = false;
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  // Leaderboard view
  if (showLeaderboard) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container px-4 py-8 max-w-lg mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setShowLeaderboard(false)} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
          </Button>
          <div className="text-center space-y-2">
            <Medal className="w-10 h-10 mx-auto text-primary" />
            <h2 className="font-display font-bold text-2xl">Topplista</h2>
          </div>
          <div className="flex gap-1 justify-center">
            {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
              <Button
                key={d}
                size="sm"
                variant={leaderboardDiff === d ? "default" : "outline"}
                onClick={() => { setLeaderboardDiff(d); fetchLeaderboard(d); }}
                className="font-display text-xs"
              >
                {DIFFICULTY_CONFIG[d].label.split(" ")[0]}
              </Button>
            ))}
          </div>
          <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary/80 to-primary px-4 py-2">
              <span className="font-display font-bold text-primary-foreground text-sm">{DIFFICULTY_CONFIG[leaderboardDiff].label}</span>
            </div>
            <ScrollArea className="max-h-96">
              <div className="divide-y divide-border">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Inga poäng ännu — bli den första!</p>
                ) : leaderboard.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-6 text-center font-display font-bold text-sm">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-display font-bold text-sm truncate block">{entry.username}</span>
                      <span className="text-xs text-muted-foreground">{entry.moves} drag · {formatTime(entry.time_seconds)}</span>
                    </div>
                    <span className="font-display font-bold text-primary text-sm">{entry.score}p</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container px-4 py-8 max-w-lg mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka till spel
          </Button>

          <div className="text-center space-y-3">
            <div className="text-6xl mb-2">🧠</div>
            <h2 className="font-display font-bold text-3xl">Memory</h2>
            <p className="text-muted-foreground text-sm">Hitta alla matchande par så snabbt du kan!</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-center text-sm text-muted-foreground uppercase tracking-wider">Välj svårighetsgrad</h3>
            {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG.easy][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => startGame(key)}
                className="w-full rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-colors p-4 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display font-bold text-base group-hover:text-primary transition-colors">{cfg.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{cfg.pairs * 2} kort</p>
                  </div>
                  {bestScores[key] ? (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Ditt bästa</div>
                      <div className="font-display font-bold text-primary text-sm">{bestScores[key]}p</div>
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full font-display gap-2"
            onClick={() => { setShowLeaderboard(true); fetchLeaderboard(leaderboardDiff); }}
          >
            <Medal className="w-4 h-4" /> Visa topplista
          </Button>

          {!username && (
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Lägg till <code className="bg-muted px-1 rounded font-mono text-foreground">?usr=DittNamn</code> i URL:en för att spara poäng på topplistan
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const config = DIFFICULTY_CONFIG[difficulty];
  const score = calcScore(moves, seconds, totalPairs);

  // Game over screen
  if (gameOver) {
    const best = bestScores[difficulty] || 0;
    const isNewBest = score >= best;
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container px-4 py-8 max-w-lg mx-auto space-y-6 text-center">
          <div className="text-6xl mb-2">🎉</div>
          <h2 className="font-display font-bold text-3xl">Grattis!</h2>
          <p className="text-muted-foreground">Du hittade alla {totalPairs} par!</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-display font-bold text-xl text-primary">{score}p</div>
              <div className="text-xs text-muted-foreground">Poäng</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <MousePointerClick className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-display font-bold text-xl">{moves}</div>
              <div className="text-xs text-muted-foreground">Drag</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-display font-bold text-xl">{formatTime(seconds)}</div>
              <div className="text-xs text-muted-foreground">Tid</div>
            </div>
          </div>

          {isNewBest && (
            <div className="text-sm font-display font-bold text-primary animate-pulse">
              ⭐ Nytt rekord! ⭐
            </div>
          )}

          {!username && (
            <p className="text-xs text-muted-foreground">Poängen sparades inte — lägg till ?usr=DittNamn i URL:en</p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => startGame(difficulty)} className="font-display gap-1">
              <RotateCcw className="w-4 h-4" /> Spela igen
            </Button>
            <Button variant="outline" onClick={() => { setShowLeaderboard(true); setLeaderboardDiff(difficulty); fetchLeaderboard(difficulty); }} className="font-display gap-1">
              <Medal className="w-4 h-4" /> Topplista
            </Button>
            <Button variant="outline" onClick={() => setDifficulty(null)} className="font-display">
              Byt svårighet
            </Button>
            <Button variant="ghost" onClick={onBack} className="font-display">
              Tillbaka
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game board
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container px-4 py-4 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
          </Button>
          <div className="flex items-center gap-4 text-sm font-display">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {formatTime(seconds)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MousePointerClick className="w-3.5 h-3.5" /> {moves} drag
            </span>
            <span className="text-primary font-bold">{matchedPairs}/{totalPairs} par</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => startGame(difficulty)} className="text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            maxWidth: config.cols * 80,
          }}
        >
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                aspect-square rounded-lg border-2 text-2xl sm:text-3xl font-bold
                transition-all duration-300 transform
                ${card.matched
                  ? "border-primary/50 bg-primary/10 scale-95 opacity-60"
                  : card.flipped
                    ? "border-primary bg-card rotate-0 scale-105"
                    : "border-border bg-gradient-to-br from-primary/60 to-primary/80 hover:from-primary/50 hover:to-primary/70 cursor-pointer hover:scale-105"
                }
              `}
              disabled={card.matched}
            >
              {card.flipped || card.matched ? (
                <span className="block">{card.emoji}</span>
              ) : (
                <span className="text-primary-foreground/30 text-lg font-display">?</span>
              )}
            </button>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground font-display">
          Aktuell poäng: <span className="text-primary font-bold">{score}p</span>
        </div>
      </div>
    </div>
  );
}
