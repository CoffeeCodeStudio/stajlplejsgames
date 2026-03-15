import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, RotateCcw, Trophy, Clock, Medal, Apple, ArrowUp, ArrowDown, ArrowRight as ArrowRightIcon, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

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
}

export function SnakeGame({ onBack }: Props) {
  const { user } = useAuth();
  const { profile } = useProfile();
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
    if (!user || !profile || scoreSaved) return;
    setScoreSaved(true);
    await supabase.from('snake_highscores').insert({
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      score: finalScore,
      apples_eaten: apples,
      time_seconds: timeSec,
    });
  }, [user, profile, scoreSaved]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = GRID_SIZE * CELL_SIZE;
    const h = GRID_SIZE * CELL_SIZE;

    // Background - dark retro grid
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);

    // Grid lines
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

    // Apple
    const apple = appleRef.current;
    ctx.fillStyle = "#ff3b3b";
    ctx.shadowColor = "#ff3b3b";
    ctx.shadowBlur = 8;
    ctx.fillRect(
      apple.x * CELL_SIZE + 2,
      apple.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
    // Apple highlight
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(
      apple.x * CELL_SIZE + 3,
      apple.y * CELL_SIZE + 3,
      4,
      4
    );
    ctx.shadowBlur = 0;

    // Snake
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

      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );

      // Pixel eyes on head
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

    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame();
      return;
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    const newSnake = [head, ...snake];
    const apple = appleRef.current;

    if (head.x === apple.x && head.y === apple.y) {
      // Ate apple
      applesRef.current += 1;
      scoreRef.current += 10 + Math.floor(applesRef.current / 5) * 5;
      setScore(scoreRef.current);
      setApplesEaten(applesRef.current);
      appleRef.current = getRandomPosition(newSnake);

      // Speed up
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

    // Need to wait for canvas to mount
    setTimeout(() => {
      drawGame();
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(() => tick(), INITIAL_SPEED);
    }, 50);
  }, [drawGame, tick]);

  // Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKey = (e: KeyboardEvent) => {
      const dir = directionRef.current;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          if (dir !== "DOWN") nextDirectionRef.current = "UP";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          if (dir !== "UP") nextDirectionRef.current = "DOWN";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          if (dir !== "RIGHT") nextDirectionRef.current = "LEFT";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          if (dir !== "LEFT") nextDirectionRef.current = "RIGHT";
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Touch controls handler
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
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
        <div className="container px-4 py-8 max-w-lg mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setGameState("menu")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
          </Button>
          <div className="text-center space-y-2">
            <Medal className="w-10 h-10 mx-auto text-primary" />
            <h1 className="font-display font-bold text-2xl">Snake Topplista</h1>
          </div>
          <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2">
              <span className="font-display font-bold text-white text-sm">🐍 Bästa spelare</span>
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
                      <span className="text-xs text-muted-foreground">{entry.apples_eaten} äpplen · {formatTime(entry.time_seconds)}</span>
                    </div>
                    <span className="font-display font-bold text-emerald-400 text-sm">{entry.score}p</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }

  // Menu
  if (gameState === "menu") {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
        <div className="container px-4 py-8 max-w-lg mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka till spel
          </Button>

          <div className="text-center space-y-3">
            <div className="text-6xl mb-2" style={{ imageRendering: "pixelated" }}>🐍</div>
            <h1 className="font-display font-bold text-3xl text-emerald-400">Snake</h1>
            <p className="text-muted-foreground text-sm">Styr ormen, ät äpplen och väx dig längre!</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={startGame}
              className="w-full font-display text-lg py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white"
              size="lg"
            >
              🎮 Starta spelet
            </Button>

            <Button
              variant="outline"
              className="w-full font-display gap-2"
              onClick={() => { setGameState("leaderboard"); fetchLeaderboard(); }}
            >
              <Medal className="w-4 h-4" /> Visa topplista
            </Button>
          </div>

          {highScore > 0 && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground">Ditt bästa: </span>
              <span className="font-display font-bold text-emerald-400">{highScore}p</span>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card/50 p-4 space-y-2">
            <h3 className="font-display font-bold text-sm flex items-center gap-1"><Trophy className="w-3 h-3 text-emerald-400" /> Kontroller</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Piltangenter eller WASD för att styra</li>
              <li>• Ät 🔴 äpplen för att växa och få poäng</li>
              <li>• Undvik väggar och din egen svans</li>
              <li>• Ju fler äpplen, desto snabbare!</li>
              <li>• Mobilknappar visas på touchskärmar</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Game over
  if (gameState === "gameover") {
    const isNewBest = score >= highScore;
    return (
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
        <div className="container px-4 py-8 max-w-lg mx-auto space-y-6 text-center">
          <div className="text-6xl mb-2">💀</div>
          <h1 className="font-display font-bold text-3xl text-red-400">Game Over!</h1>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="font-display font-bold text-xl text-emerald-400">{score}p</div>
              <div className="text-xs text-muted-foreground">Poäng</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <Apple className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <div className="font-display font-bold text-xl">{applesEaten}</div>
              <div className="text-xs text-muted-foreground">Äpplen</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-display font-bold text-xl">{formatTime(seconds)}</div>
              <div className="text-xs text-muted-foreground">Tid</div>
            </div>
          </div>

          {isNewBest && score > 0 && (
            <div className="text-sm font-display font-bold text-emerald-400 animate-pulse">
              ⭐ Nytt rekord! ⭐
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={startGame} className="font-display gap-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600">
              <RotateCcw className="w-4 h-4" /> Spela igen
            </Button>
            <Button variant="outline" onClick={() => { setGameState("leaderboard"); fetchLeaderboard(); }} className="font-display gap-1">
              <Medal className="w-4 h-4" /> Topplista
            </Button>
            <Button variant="ghost" onClick={onBack} className="font-display">
              Tillbaka
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  const canvasSize = GRID_SIZE * CELL_SIZE;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="container px-4 py-4 max-w-2xl mx-auto space-y-3">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { endGame(); setGameState("menu"); }} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Avsluta
          </Button>
          <div className="flex items-center gap-4 text-sm font-display">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {formatTime(seconds)}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <Apple className="w-3.5 h-3.5" /> {applesEaten}
            </span>
            <span className="text-emerald-400 font-bold">{score}p</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div
            className="rounded-lg border-2 border-emerald-800/50 overflow-hidden shadow-lg shadow-emerald-900/20"
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
            <Button
              variant="outline"
              size="sm"
              className="aspect-square p-0 border-emerald-800/50 active:bg-emerald-900/50"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("UP"); }}
              onClick={() => handleDirection("UP")}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
            <div />
            <Button
              variant="outline"
              size="sm"
              className="aspect-square p-0 border-emerald-800/50 active:bg-emerald-900/50"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("LEFT"); }}
              onClick={() => handleDirection("LEFT")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="aspect-square p-0 border-emerald-800/50 active:bg-emerald-900/50"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("DOWN"); }}
              onClick={() => handleDirection("DOWN")}
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="aspect-square p-0 border-emerald-800/50 active:bg-emerald-900/50"
              onTouchStart={(e) => { e.preventDefault(); handleDirection("RIGHT"); }}
              onClick={() => handleDirection("RIGHT")}
            >
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
