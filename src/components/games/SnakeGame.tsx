import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fireConfetti, playVictorySound, playGameOverSound, playPickupSound } from "@/lib/game-effects";
import { useToast } from "@/hooks/use-toast";

const GRID_SIZE = 20;
const CELL_SIZE = 16;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 2;
const MIN_SPEED = 60;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

interface HighscoreEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  apples_eaten: number;
  time_seconds: number;
  created_at: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

interface Props {
  onBack: () => void;
  username: string | null;
}

export function SnakeGame({ onBack, username }: Props) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const directionRef = useRef<Direction>("RIGHT");
  const nextDirectionRef = useRef<Direction>("RIGHT");
  const snakeRef = useRef<Position[]>([{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }]);
  const appleRef = useRef<Position>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const applesRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const secondsRef = useRef(0);

  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover" | "leaderboard">("menu");
  const [score, setScore] = useState(0);
  const [applesEaten, setApplesEaten] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("snake-best") || "0"); } catch { return 0; }
  });
  const [leaderboard, setLeaderboard] = useState<HighscoreEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  const INVALID_USERNAMES = new Set(["firefox", "chrome", "safari", "edge", "opera", "brave", "vivaldi", "chromium"]);

  const fetchLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('snake_highscores')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);
    const seen = new Set<string>();
    const unique = ((data as HighscoreEntry[]) || []).filter(e => {
      if (INVALID_USERNAMES.has(e.username.toLowerCase())) return false;
      if (seen.has(e.username)) return false;
      seen.add(e.username);
      return true;
    }).slice(0, 10);
    setLeaderboard(unique);
  }, []);

  const saveScore = useCallback(async (finalScore: number, apples: number, timeSec: number) => {
    if (scoreSaved) return;
    setScoreSaved(true);

    // Always save to localStorage
    const localKey = 'snake-best';
    const localBest = parseInt(localStorage.getItem(localKey) || '0');
    if (finalScore > localBest) {
      localStorage.setItem(localKey, String(finalScore));
    }

    // Only save to database if ?usr= is set and not a generic name
    const BLOCKED_NAMES = ['gäst', 'anonym', 'guest', 'anonymous', 'användarnamn', 'anvndarnamn', 'namn', 'test', 'user'];
    if (!username || BLOCKED_NAMES.includes(username.toLowerCase())) return;

    // Check if player already has a higher score in DB
    const { data: existing } = await supabase
      .from('snake_highscores')
      .select('id, score')
      .eq('username', username)
      .order('score', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0 && existing[0].score >= finalScore) {
      return;
    }

    await supabase.from('snake_highscores').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      username: username,
      avatar_url: null,
      score: finalScore,
      apples_eaten: apples,
      time_seconds: timeSec,
    });

    toast({ title: "🏆 Ditt rekord har sparats!" });
  }, [username, scoreSaved]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = GRID_SIZE * CELL_SIZE;
    const h = GRID_SIZE * CELL_SIZE;

    // Dark background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, w, h);

    // Grid overlay
    ctx.strokeStyle = "rgba(0, 255, 80, 0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(w, i * CELL_SIZE);
      ctx.stroke();
    }

    // Scanline overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // Apple - bright red pixel block
    const apple = appleRef.current;
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff1111";
    ctx.fillRect(apple.x * CELL_SIZE + 1, apple.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    // Apple highlight pixel
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff6666";
    ctx.fillRect(apple.x * CELL_SIZE + 3, apple.y * CELL_SIZE + 3, 3, 3);
    // Apple stem
    ctx.fillStyle = "#33aa33";
    ctx.fillRect(apple.x * CELL_SIZE + 6, apple.y * CELL_SIZE, 3, 3);

    // Snake - bright green with pixel art feel
    const snake = snakeRef.current;
    snake.forEach((segment, i) => {
      const isHead = i === 0;

      if (isHead) {
        ctx.shadowColor = "#00ff44";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#00ff44";
      } else {
        ctx.shadowBlur = 0;
        const g = Math.max(100, 220 - i * 6);
        ctx.fillStyle = `rgb(0, ${g}, 30)`;
      }

      // Pixel block body
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );

      // Inner pixel highlight for depth
      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#88ffaa";
        ctx.fillRect(segment.x * CELL_SIZE + 3, segment.y * CELL_SIZE + 3, 3, 3);

        // Eyes
        ctx.fillStyle = "#000";
        const dir = directionRef.current;
        const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
        const eo = 3;

        if (dir === "RIGHT" || dir === "LEFT") {
          const dx = dir === "RIGHT" ? eo : -eo;
          ctx.fillRect(cx + dx - 1, cy - 4, 2, 2);
          ctx.fillRect(cx + dx - 1, cy + 2, 2, 2);
        } else {
          const dy = dir === "DOWN" ? eo : -eo;
          ctx.fillRect(cx - 4, cy + dy - 1, 2, 2);
          ctx.fillRect(cx + 2, cy + dy - 1, 2, 2);
        }
      } else {
        // Body segment inner pixel
        ctx.fillStyle = `rgba(100, 255, 140, 0.3)`;
        ctx.fillRect(segment.x * CELL_SIZE + 3, segment.y * CELL_SIZE + 3, 2, 2);
      }
    });

    ctx.shadowBlur = 0;
  }, []);

  const endGame = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalScore = scoreRef.current;
    const apples = applesRef.current;
    const timePlayed = secondsRef.current;

    setScore(finalScore);
    setApplesEaten(apples);
    setGameState("gameover");
    playGameOverSound();

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("snake-best", String(finalScore));
      fireConfetti();
      playVictorySound();
    }

    saveScore(finalScore, apples, timePlayed);
    fetchLeaderboard();
  }, [highScore, saveScore, fetchLeaderboard]);

  const tick = useCallback(() => {
    const snake = snakeRef.current;
    directionRef.current = nextDirectionRef.current;
    const dir = directionRef.current;

    const head = { ...snake[0] };
    if (dir === "UP") head.y -= 1;
    if (dir === "DOWN") head.y += 1;
    if (dir === "LEFT") head.x -= 1;
    if (dir === "RIGHT") head.x += 1;

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    const newSnake = [head, ...snake];
    const apple = appleRef.current;

    if (head.x === apple.x && head.y === apple.y) {
      applesRef.current += 1;
      scoreRef.current += 10 + Math.floor(applesRef.current / 5) * 5;
      setScore(scoreRef.current);
      setApplesEaten(applesRef.current);
      playPickupSound();
      appleRef.current = getRandomPosition(newSnake);

      speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREASE);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(() => {
        tick();
      }, speedRef.current);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    drawGame();
  }, [drawGame, endGame]);

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
    appleRef.current = { x: 15, y: 10 };
    directionRef.current = "RIGHT";
    nextDirectionRef.current = "RIGHT";
    scoreRef.current = 0;
    applesRef.current = 0;
    speedRef.current = INITIAL_SPEED;

    setScore(0);
    setApplesEaten(0);
    setSeconds(0);
    setScoreSaved(false);
    setGameState("playing");

    setTimeout(() => {
      drawGame();
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(() => tick(), INITIAL_SPEED);
    }, 50);
  }, [drawGame, tick]);

  useEffect(() => {
    if (gameState === "playing") {
      secondsRef.current = 0;
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(s => s + 1);
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKey = (e: KeyboardEvent) => {
      const dir = directionRef.current;
      switch (e.key) {
        case "ArrowUp": case "w": case "W":
          e.preventDefault();
          if (dir !== "DOWN") nextDirectionRef.current = "UP";
          break;
        case "ArrowDown": case "s": case "S":
          e.preventDefault();
          if (dir !== "UP") nextDirectionRef.current = "DOWN";
          break;
        case "ArrowLeft": case "a": case "A":
          e.preventDefault();
          if (dir !== "RIGHT") nextDirectionRef.current = "LEFT";
          break;
        case "ArrowRight": case "d": case "D":
          e.preventDefault();
          if (dir !== "LEFT") nextDirectionRef.current = "RIGHT";
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleDirection = (dir: Direction) => {
    const current = directionRef.current;
    if (
      (dir === "UP" && current !== "DOWN") ||
      (dir === "DOWN" && current !== "UP") ||
      (dir === "LEFT" && current !== "RIGHT") ||
      (dir === "RIGHT" && current !== "LEFT")
    ) {
      nextDirectionRef.current = dir;
    }
  };

  // Leaderboard view
  if (gameState === "leaderboard") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-4 space-y-3">
          <button onClick={() => setGameState("menu")} className="retro-btn text-[10px]">← Tillbaka till spel</button>
          <div className="retro-panel">
            <div className="retro-panel-header">🏆 TOPPLISTA — SNAKE</div>
            <div className="max-h-96 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-8 font-pixel">Ingen har spelat ännu — bli först!</p>
              ) : leaderboard.map((entry, i) => {
                const date = new Date(entry.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
                return (
                <div key={entry.id} className="retro-table-row">
                  <span className="w-8 text-center font-bold text-xs">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs truncate block">{entry.username}</span>
                    <span className="text-[10px] text-muted-foreground">{entry.apples_eaten} äpplen · {formatTime(entry.time_seconds)} · {date}</span>
                  </div>
                  <span className="font-bold text-primary text-xs">{entry.score}p</span>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Menu
  if (gameState === "menu") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-4 space-y-3">
          <button onClick={onBack} className="retro-btn text-[10px]">← Tillbaka till spel</button>

          <div className="retro-panel">
            <div className="retro-panel-header">🐍 SNAKE</div>
            <div className="retro-panel-body text-center space-y-3">
              {/* Pixel snake art */}
              <div className="flex justify-center gap-0.5 py-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-none"
                    style={{
                      backgroundColor: i === 0 ? '#00ff44' : `rgb(0, ${Math.max(100, 220 - i * 15)}, 30)`,
                      boxShadow: i === 0 ? '0 0 6px #00ff44' : 'none',
                    }}
                  />
                ))}
                <div className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: '#ff1111', boxShadow: '0 0 6px #ff0000' }} />
              </div>
              <p className="text-sm text-muted-foreground">Styr ormen, ät äpplen och väx dig längre!</p>
              {highScore > 0 && (
                <div className="retro-inset p-3 my-2">
                  <div className="font-pixel text-[9px] text-muted-foreground mb-1">DITT BÄSTA</div>
                  <div className="font-pixel text-lg text-primary" style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.6)' }}>{highScore}p</div>
                </div>
              )}
              <div className="retro-separator" />
              <button onClick={startGame} className="retro-btn retro-btn-primary text-sm px-6 py-2">
                ▶ STARTA SPELET
              </button>
            </div>
          </div>

          <button
            className="retro-btn w-full justify-center"
            onClick={() => { setGameState("leaderboard"); fetchLeaderboard(); }}
          >
            🏆 Visa topplista
          </button>

        </div>
      </div>
    );
  }

  // Game over
  if (gameState === "gameover") {
    const isNewBest = score >= highScore;
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-4 space-y-3 text-center">
          <div className="retro-panel">
            <div className="retro-panel-header">💀 GAME OVER</div>
            <div className="retro-panel-body space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="retro-inset p-2">
                  <div className="font-pixel text-[10px] text-primary">{score}p</div>
                  <div className="text-[9px] text-muted-foreground font-pixel">POÄNG</div>
                </div>
                <div className="retro-inset p-2">
                  <div className="font-pixel text-[10px] text-foreground">{applesEaten}</div>
                  <div className="text-[9px] text-muted-foreground font-pixel">ÄPPLEN</div>
                </div>
                <div className="retro-inset p-2">
                  <div className="font-pixel text-[10px] text-foreground">{formatTime(seconds)}</div>
                  <div className="text-[9px] text-muted-foreground font-pixel">TID</div>
                </div>
              </div>
              {isNewBest && score > 0 && <p className="font-pixel text-[9px] text-primary animate-pulse">⭐ NYTT REKORD! ⭐</p>}
              
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={startGame} className="retro-btn retro-btn-primary">🔄 Igen</button>
            <button onClick={() => { setGameState("leaderboard"); fetchLeaderboard(); }} className="retro-btn">🏆 Topplista</button>
            <button onClick={onBack} className="retro-btn">← Tillbaka till spel</button>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  const canvasSize = GRID_SIZE * CELL_SIZE;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-3 py-3 space-y-3">
        {/* HUD bar */}
        <div className="retro-panel">
          <div className="retro-panel-body p-2 flex items-center justify-between">
            <button onClick={() => { endGame(); setGameState("menu"); }} className="retro-btn text-base py-0.5 px-2">✕ AVSLUTA</button>
            <div className="flex items-center gap-4 font-pixel text-xs">
              <span className="text-muted-foreground">⏱ {formatTime(seconds)}</span>
              <span style={{ color: '#ff1111' }}>🍎 {applesEaten}</span>
              <span className="text-primary font-bold">{score}P</span>
            </div>
          </div>
        </div>

        {/* Game canvas with retro glow border */}
        <div className="flex justify-center">
          <div
            className="relative"
            style={{
              width: canvasSize + 4,
              height: canvasSize + 4,
              border: '2px solid #00ff44',
              boxShadow: '0 0 12px rgba(0, 255, 68, 0.4), inset 0 0 12px rgba(0, 255, 68, 0.1)',
              background: '#0a0a1a',
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              style={{ display: "block", imageRendering: "pixelated" }}
            />
          </div>
        </div>

        {/* Touch controls - mobile only */}
        <div className="flex justify-center md:hidden mt-4">
          <div className="grid grid-cols-3 gap-3" style={{ width: 240 }}>
            <div />
            <button
              className="flex items-center justify-center text-2xl font-bold select-none"
              style={{ minWidth: 70, minHeight: 70, background: '#CCCCCC', color: '#000000', border: '3px solid #000000', borderRadius: 0, boxShadow: '4px 4px 0px #000000' }}
              onTouchStart={(e) => { e.preventDefault(); handleDirection("UP"); }}
              onClick={() => handleDirection("UP")}
            >▲</button>
            <div />
            <button
              className="flex items-center justify-center text-2xl font-bold select-none"
              style={{ minWidth: 70, minHeight: 70, background: '#CCCCCC', color: '#000000', border: '3px solid #000000', borderRadius: 0, boxShadow: '4px 4px 0px #000000' }}
              onTouchStart={(e) => { e.preventDefault(); handleDirection("LEFT"); }}
              onClick={() => handleDirection("LEFT")}
            >◄</button>
            <button
              className="flex items-center justify-center text-2xl font-bold select-none"
              style={{ minWidth: 70, minHeight: 70, background: '#CCCCCC', color: '#000000', border: '3px solid #000000', borderRadius: 0, boxShadow: '4px 4px 0px #000000' }}
              onTouchStart={(e) => { e.preventDefault(); handleDirection("DOWN"); }}
              onClick={() => handleDirection("DOWN")}
            >▼</button>
            <button
              className="flex items-center justify-center text-2xl font-bold select-none"
              style={{ minWidth: 70, minHeight: 70, background: '#CCCCCC', color: '#000000', border: '3px solid #000000', borderRadius: 0, boxShadow: '4px 4px 0px #000000' }}
              onTouchStart={(e) => { e.preventDefault(); handleDirection("RIGHT"); }}
              onClick={() => handleDirection("RIGHT")}
            >►</button>
          </div>
        </div>

        <p className="text-center text-[9px] text-muted-foreground font-pixel hidden md:block">
          PILTANGENTER / WASD
        </p>
      </div>
    </div>
  );
}
