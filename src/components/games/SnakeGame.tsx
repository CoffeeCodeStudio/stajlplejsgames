import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, RotateCcw, Trophy, Clock, Medal, Apple, ArrowUp, ArrowDown, ArrowRight as ArrowRightIcon, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GRID_SIZE = 20;
const CELL_SIZE = 18;
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

  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover" | "leaderboard">("menu");
  const [score, setScore] = useState(0);
  const [applesEaten, setApplesEaten] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("snake-best") || "0"); } catch { return 0; }
  });
  const [leaderboard, setLeaderboard] = useState<HighscoreEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('snake_highscores')
      .select('*')
      .order('score', { ascending: false })
      .limit(20);
    setLeaderboard((data as HighscoreEntry[]) || []);
  }, []);

  const saveScore = useCallback(async (finalScore: number, apples: number, timeSec: number) => {
    if (!username || scoreSaved) return;
    setScoreSaved(true);
    await supabase.from('snake_highscores').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      username: username,
      avatar_url: null,
      score: finalScore,
      apples_eaten: apples,
      time_seconds: timeSec,
    });
  }, [username, scoreSaved]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = GRID_SIZE * CELL_SIZE;
    const h = GRID_SIZE * CELL_SIZE;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#16213e";
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

    const apple = appleRef.current;
    ctx.fillStyle = "#ff3b3b";
    ctx.shadowColor = "#ff3b3b";
    ctx.shadowBlur = 8;
    ctx.fillRect(apple.x * CELL_SIZE + 2, apple.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(apple.x * CELL_SIZE + 3, apple.y * CELL_SIZE + 3, 4, 4);
    ctx.shadowBlur = 0;

    const snake = snakeRef.current;
    snake.forEach((segment, i) => {
      const isHead = i === 0;
      const brightness = Math.max(40, 100 - i * 3);

      if (isHead) {
        ctx.fillStyle = "#00ff88";
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = `hsl(150, 100%, ${brightness}%)`;
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        const dir = directionRef.current;
        const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
        const eyeOffset = 3;
        
        if (dir === "RIGHT" || dir === "LEFT") {
          const dx = dir === "RIGHT" ? eyeOffset : -eyeOffset;
          ctx.fillRect(cx + dx - 1, cy - 4, 3, 3);
          ctx.fillRect(cx + dx - 1, cy + 2, 3, 3);
        } else {
          const dy = dir === "DOWN" ? eyeOffset : -eyeOffset;
          ctx.fillRect(cx - 4, cy + dy - 1, 3, 3);
          ctx.fillRect(cx + 2, cy + dy - 1, 3, 3);
        }
      }
    });
  }, []);

  const endGame = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const finalScore = scoreRef.current;
    const apples = applesRef.current;
    
    setScore(finalScore);
    setApplesEaten(apples);
    setGameState("gameover");

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("snake-best", String(finalScore));
    }

    saveScore(finalScore, apples, seconds);
    fetchLeaderboard();
  }, [highScore, saveScore, fetchLeaderboard, seconds]);

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
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
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
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button onClick={() => setGameState("menu")} className="retro-btn text-xs">← Tillbaka</button>
          <div className="retro-panel">
            <div className="retro-panel-header">🏆 TOPPLISTA — SNAKE</div>
            <div className="max-h-96 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-8">Inga poäng ännu!</p>
              ) : leaderboard.map((entry, i) => (
                <div key={entry.id} className="retro-table-row">
                  <span className="w-8 text-center font-bold text-xs">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs truncate block">{entry.username}</span>
                    <span className="text-[10px] text-muted-foreground">{entry.apples_eaten} äpplen · {formatTime(entry.time_seconds)}</span>
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

  // Menu
  if (gameState === "menu") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button onClick={onBack} className="retro-btn text-xs">← Tillbaka till spel</button>

          <div className="retro-panel">
            <div className="retro-panel-header">🐍 SNAKE</div>
            <div className="retro-panel-body text-center space-y-3">
              <p className="text-sm text-muted-foreground">Styr ormen, ät äpplen och väx dig längre!</p>
              {highScore > 0 && (
                <p className="text-xs">Ditt bästa: <span className="text-primary font-bold">{highScore}p</span></p>
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

          {!username && (
            <div className="retro-panel">
              <div className="retro-panel-body text-center text-xs text-muted-foreground">
                Lägg till <code className="text-primary bg-background px-1">?usr=DittNamn</code> i URL:en för att spara poäng
              </div>
            </div>
          )}

          <div className="retro-panel">
            <div className="retro-panel-header">📖 KONTROLLER</div>
            <div className="retro-panel-body text-xs text-muted-foreground space-y-1">
              <p>• Piltangenter eller WASD för att styra</p>
              <p>• Ät 🔴 äpplen för att växa och få poäng</p>
              <p>• Undvik väggar och din egen svans!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game over
  if (gameState === "gameover") {
    const isNewBest = score >= highScore;
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4 text-center">
          <div className="retro-panel">
            <div className="retro-panel-header">💀 GAME OVER</div>
            <div className="retro-panel-body space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="retro-inset p-2">
                  <div className="font-bold text-primary text-lg">{score}p</div>
                  <div className="text-[10px] text-muted-foreground">Poäng</div>
                </div>
                <div className="retro-inset p-2">
                  <div className="font-bold text-lg">{applesEaten}</div>
                  <div className="text-[10px] text-muted-foreground">Äpplen</div>
                </div>
                <div className="retro-inset p-2">
                  <div className="font-bold text-lg">{formatTime(seconds)}</div>
                  <div className="text-[10px] text-muted-foreground">Tid</div>
                </div>
              </div>
              {isNewBest && score > 0 && <p className="font-pixel text-[9px] text-primary animate-pulse">⭐ NYTT REKORD! ⭐</p>}
              {!username && <p className="text-[10px] text-muted-foreground">Poäng ej sparad — lägg till ?usr=Namn</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button onClick={startGame} className="retro-btn retro-btn-primary">🔄 Igen</button>
            <button onClick={() => { setGameState("leaderboard"); fetchLeaderboard(); }} className="retro-btn">🏆 Topplista</button>
            <button onClick={onBack} className="retro-btn">← Tillbaka</button>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  const canvasSize = GRID_SIZE * CELL_SIZE;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container px-4 py-4 max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { endGame(); setGameState("menu"); }} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Avsluta
          </Button>
          <div className="flex items-center gap-4 text-sm font-display">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {formatTime(seconds)}
            </span>
            <span className="flex items-center gap-1 text-destructive">
              <Apple className="w-3.5 h-3.5" /> {applesEaten}
            </span>
            <span className="text-primary font-bold">{score}p</span>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            className="rounded-lg border-2 border-border overflow-hidden shadow-lg"
            style={{ width: canvasSize, height: canvasSize }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              style={{ display: "block", imageRendering: "pixelated" }}
            />
          </div>
        </div>

        {/* Touch controls */}
        <div className="flex justify-center md:hidden">
          <div className="grid grid-cols-3 gap-1 w-36">
            <div />
            <Button variant="outline" size="sm" className="aspect-square p-0"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("UP"); }}
              onClick={() => handleDirection("UP")}>
              <ArrowUp className="w-5 h-5" />
            </Button>
            <div />
            <Button variant="outline" size="sm" className="aspect-square p-0"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("LEFT"); }}
              onClick={() => handleDirection("LEFT")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" className="aspect-square p-0"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("DOWN"); }}
              onClick={() => handleDirection("DOWN")}>
              <ArrowDown className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" className="aspect-square p-0"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("RIGHT"); }}
              onClick={() => handleDirection("RIGHT")}>
              <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground font-display hidden md:block">
          Använd piltangenterna eller WASD för att styra
        </p>
      </div>
    </div>
  );
}
