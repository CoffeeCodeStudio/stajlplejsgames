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
        <div className="px-3 py-4 space-y-3">
          <button onClick={() => setShowLeaderboard(false)} className="retro-btn text-xs">← Tillbaka</button>
          <div className="retro-panel">
            <div className="retro-panel-header">🏆 TOPPLISTA — MEMORY</div>
            <div className="flex gap-1 p-2 bg-[hsl(222_30%_16%)] border-b border-border">
              {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => { setLeaderboardDiff(d); fetchLeaderboard(d); }}
                  className={`retro-btn text-[10px] ${leaderboardDiff === d ? 'retro-btn-primary' : ''}`}
                >
                  {DIFFICULTY_CONFIG[d].label.split(" ")[0]}
                </button>
              ))}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-8">Inga poäng ännu — bli den första!</p>
              ) : leaderboard.map((entry, i) => (
                <div key={entry.id} className="retro-table-row">
                  <span className="w-8 text-center font-bold text-xs">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs truncate block">{entry.username}</span>
                    <span className="text-[10px] text-muted-foreground">{entry.moves} drag · {formatTime(entry.time_seconds)}</span>
                  </div>
                  <span className="font-bold text-primary text-xs">{entry.score}p</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-4 space-y-3">
          <button onClick={onBack} className="retro-btn text-[10px]">← Tillbaka till spel</button>

          <div className="retro-panel">
            <div className="retro-panel-header">🧠 MEMORY</div>
            <div className="retro-panel-body text-center space-y-3">
              <p className="text-sm text-muted-foreground">Hitta alla matchande par så snabbt du kan!</p>
              <div className="retro-separator" />
              <p className="font-pixel text-[9px] text-primary uppercase">Välj svårighetsgrad</p>
            </div>
          </div>

          <div className="space-y-2">
            {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG.easy][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => startGame(key)}
                className="w-full retro-panel hover:border-primary transition-colors text-left"
              >
                <div className="retro-panel-body flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm">{cfg.label}</span>
                    <p className="text-[10px] text-muted-foreground">{cfg.pairs * 2} kort</p>
                  </div>
                  {bestScores[key] ? (
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Bästa</div>
                      <div className="font-bold text-primary text-sm">{bestScores[key]}p</div>
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          <button
            className="retro-btn w-full justify-center"
            onClick={() => { setShowLeaderboard(true); fetchLeaderboard(leaderboardDiff); }}
          >
            🏆 Visa topplista
          </button>

          {!username && (
            <div className="retro-panel">
              <div className="retro-panel-body text-center text-xs text-muted-foreground">
                Lägg till <code className="text-primary bg-background px-1">?usr=DittNamn</code> i URL:en för att spara poäng
              </div>
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
        <div className="px-3 py-4 space-y-3 text-center">
          <div className="retro-panel">
            <div className="retro-panel-header">🎉 GRATTIS!</div>
            <div className="retro-panel-body space-y-3">
              <p className="text-sm text-muted-foreground">Du hittade alla {totalPairs} par!</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="retro-inset p-2">
                  <div className="font-bold text-primary text-lg">{score}p</div>
                  <div className="text-[10px] text-muted-foreground">Poäng</div>
                </div>
                <div className="retro-inset p-2">
                  <div className="font-bold text-lg">{moves}</div>
                  <div className="text-[10px] text-muted-foreground">Drag</div>
                </div>
                <div className="retro-inset p-2">
                  <div className="font-bold text-lg">{formatTime(seconds)}</div>
                  <div className="text-[10px] text-muted-foreground">Tid</div>
                </div>
              </div>
              {isNewBest && <p className="font-pixel text-[9px] text-primary animate-pulse">⭐ NYTT REKORD! ⭐</p>}
              {!username && <p className="text-[10px] text-muted-foreground">Poäng ej sparad — lägg till ?usr=Namn</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={() => startGame(difficulty)} className="retro-btn">🔄 Igen</button>
            <button onClick={() => { setShowLeaderboard(true); setLeaderboardDiff(difficulty); fetchLeaderboard(difficulty); }} className="retro-btn">🏆 Topplista</button>
            <button onClick={() => setDifficulty(null)} className="retro-btn">Byt svårighet</button>
            <button onClick={onBack} className="retro-btn">← Tillbaka</button>
          </div>
        </div>
      </div>
    );
  }

  // Game board
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="retro-btn text-[10px]">←</button>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">⏱ {formatTime(seconds)}</span>
            <span className="text-muted-foreground">🖱 {moves} drag</span>
            <span className="text-primary font-bold">{matchedPairs}/{totalPairs} par</span>
          </div>
          <button onClick={() => startGame(difficulty)} className="retro-btn text-[10px]">🔄</button>
        </div>

        <div
          className="grid gap-1.5 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            maxWidth: config.cols * 72,
          }}
        >
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                aspect-square border-2 text-xl sm:text-2xl font-bold transition-all duration-200
                ${card.matched
                  ? "border-primary/40 bg-primary/10 opacity-50"
                  : card.flipped
                    ? "border-primary bg-[hsl(222_35%_18%)]"
                    : "border-border bg-[hsl(220_20%_25%)] hover:border-primary/50 cursor-pointer hover:bg-[hsl(220_20%_28%)]"
                }
              `}
              disabled={card.matched}
            >
              {card.flipped || card.matched ? (
                <span>{card.emoji}</span>
              ) : (
                <span className="text-muted-foreground text-sm">?</span>
              )}
            </button>
          ))}
        </div>

        <div className="text-center text-[10px] text-muted-foreground">
          Poäng: <span className="text-primary font-bold">{score}p</span>
        </div>
      </div>
    </div>
  );
}
