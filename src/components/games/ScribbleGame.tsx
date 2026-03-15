import { useState, useRef, useEffect, useCallback } from "react";
import { useScribbleGame } from "@/hooks/useScribble";
import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Eraser, Paintbrush, Users, Trophy, Timer, SkipForward, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInkParticles, hapticFeedback } from "./InkParticles";
import { DailyChallenge, GameOverVibes } from "./DailyChallenge";

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ScribbleGameProps {
  lobbyId: string;
  onLeave: () => void;
  guestId: string;
  guestUsername: string | null;
}

const COLORS = ["#000000", "#ff0000", "#0066ff", "#00cc44", "#ff9900", "#9933ff", "#ff69b4", "#ffffff"];
const BRUSH_SIZES = [3, 6, 10, 16];
const ROUND_TIME = 60; // seconds

const WORD_LIST = [
  "hund", "katt", "sol", "hus", "bil", "träd", "blomma", "fisk",
  "bok", "stol", "bord", "telefon", "glass", "pizza", "gitarr",
  "kanin", "elefant", "cykel", "banan", "jordgubbe", "paraply",
  "robot", "raket", "fjäril", "snögubbe", "drake", "krona",
  "hjärta", "stjärna", "måne", "berg", "sjö", "båt", "flygplan",
  "dator", "mus", "nycklar", "lampa", "klocka", "regnbåge",
  "fotboll", "skateboard", "glass", "tårta", "clown", "dinosaurie",
];

export function ScribbleGame({ lobbyId, onLeave, guestId, guestUsername }: ScribbleGameProps) {
  const { lobby, players, guesses, joinLobby, submitGuess, leaveLobby } = useScribbleGame(lobbyId, guestId, guestUsername);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [guessText, setGuessText] = useState("");
  const [currentAction, setCurrentAction] = useState<DrawPoint[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [showWordPicker, setShowWordPicker] = useState(false);
  const guessEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"canvas" | "chat">("canvas");
  const [hasVibedWinner, setHasVibedWinner] = useState(false);

  // Ink particle system
  const { onDrawMove, resetLastPos } = useInkParticles(containerRef);

  const isDrawer = lobby?.current_drawer_id === guestId;
  const isCreator = lobby?.creator_id === guestId;
  const maxRounds = players.length > 0 ? players.length * 2 : 4;

  // Join lobby on mount
  useEffect(() => {
    joinLobby();
  }, [lobbyId]); // eslint-disable-line

  // Scroll guesses to bottom
  useEffect(() => {
    guessEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guesses]);

  // Init canvas with ResizeObserver for correct sizing
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(container);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // Timer
  useEffect(() => {
    if (lobby?.status !== "playing") return;
    setTimeLeft(ROUND_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - advance turn if drawer
          if (isDrawer) advanceTurn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lobby?.round_number, lobby?.status, lobby?.current_drawer_id]); // eslint-disable-line

  // Broadcast drawing
  const broadcastChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!lobbyId) return;
    const channel = supabase.channel(`scribble-draw-${lobbyId}`);
    
    channel.on('broadcast', { event: 'draw' }, ({ payload }) => {
      if (payload.drawer_id === guestId) return;
      drawStroke(payload.points);
    }).on('broadcast', { event: 'clear' }, () => {
      clearCanvas();
    }).subscribe();

    broadcastChannel.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [lobbyId, guestId]); // eslint-disable-line

  const drawStroke = useCallback((points: DrawPoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 1; i < points.length; i++) {
      ctx.beginPath();
      ctx.strokeStyle = points[i].color;
      ctx.lineWidth = points[i].size;
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const getPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // Scale from CSS viewport pixels to canvas internal coordinates
    const scaleX = rect.width > 0 ? canvas.width / rect.width / dpr : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height / dpr : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = (e: React.PointerEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentAction([{ ...pos, color: isEraser ? "#ffffff" : color, size: brushSize }]);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !isDrawer) return;
    const pos = getPos(e);
    const drawColor = isEraser ? "#ffffff" : color;
    const point: DrawPoint = { ...pos, color: drawColor, size: brushSize };
    const newAction = [...currentAction, point];
    setCurrentAction(newAction);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const prev = currentAction[currentAction.length - 1];
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = point.color;
    ctx.lineWidth = point.size;
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    // Ink splatter particles on fast strokes
    if (!isEraser) {
      onDrawMove(pos.x, pos.y, drawColor, brushSize);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    resetLastPos();
    if (currentAction.length > 1) {
      broadcastChannel.current?.send({
        type: 'broadcast',
        event: 'draw',
        payload: { points: currentAction, drawer_id: user?.id },
      });
    }
    setCurrentAction([]);
  };

  const handleClear = () => {
    clearCanvas();
    broadcastChannel.current?.send({ type: 'broadcast', event: 'clear', payload: {} });
  };

  const handleGuess = async () => {
    if (!guessText.trim()) return;
    const isCorrect = await submitGuess(guessText.trim());
    if (isCorrect) {
      toast({ title: "🎉 Rätt svar!" });
      // Auto advance turn after correct guess
      if (isDrawer || isCreator) {
        setTimeout(() => advanceTurn(), 2000);
      }
    }
    setGuessText("");
  };

  const advanceTurn = async () => {
    if (!lobby || players.length === 0) return;
    const nextRound = (lobby.round_number || 0) + 1;

    if (nextRound > maxRounds) {
      // Game over - close lobby
      await supabase.from('scribble_lobbies').update({
        status: 'finished',
        current_word: null,
        current_drawer_id: null,
      }).eq('id', lobbyId);
      toast({ title: "🏆 Spelet är slut!", description: "Kolla poängtavlan!" });
      return;
    }

    // Rotate drawer
    const currentIdx = players.findIndex(p => p.user_id === lobby.current_drawer_id);
    const nextIdx = (currentIdx + 1) % players.length;
    const nextDrawer = players[nextIdx];

    // If next drawer is me, show word picker
    if (nextDrawer.user_id === user?.id) {
      const choices = [];
      const used = new Set<string>();
      while (choices.length < 3) {
        const w = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        if (!used.has(w)) { choices.push(w); used.add(w); }
      }
      setWordChoices(choices);
      setShowWordPicker(true);
    }

    await supabase.from('scribble_lobbies').update({
      current_drawer_id: nextDrawer.user_id,
      round_number: nextRound,
      current_word: null, // Will be set when drawer picks
      status: 'playing',
    }).eq('id', lobbyId);

    clearCanvas();
  };

  const pickWord = async (word: string) => {
    setShowWordPicker(false);
    setWordChoices([]);
    await supabase.from('scribble_lobbies').update({
      current_word: word,
    }).eq('id', lobbyId);
    clearCanvas();
  };

  const handleStartRound = () => {
    const choices: string[] = [];
    const used = new Set<string>();
    while (choices.length < 3) {
      const w = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      if (!used.has(w)) { choices.push(w); used.add(w); }
    }
    setWordChoices(choices);
    setShowWordPicker(true);
  };

  const startWithWord = async (word: string) => {
    setShowWordPicker(false);
    setWordChoices([]);
    await supabase.from('scribble_lobbies').update({
      status: 'playing',
      current_word: word,
      current_drawer_id: user?.id,
      round_number: 1,
    }).eq('id', lobbyId);
    clearCanvas();
  };

  const handleLeave = async () => {
    await leaveLobby();
    onLeave();
  };

  const timerColor = timeLeft <= 10 ? "text-red-400" : timeLeft <= 20 ? "text-orange-400" : "text-white/80";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={handleLeave} className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground hover:bg-primary-foreground/20 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <h2 className="font-display font-bold text-primary-foreground text-xs sm:text-sm truncate">{lobby?.title || "Scribble"}</h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-primary-foreground/80 text-xs shrink-0">
          {lobby?.status === "playing" && (
            <span className={`flex items-center gap-1 font-mono font-bold ${timerColor}`}>
              <Timer className="w-3 h-3" />
              {timeLeft}s
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {players.length}
          </span>
          {lobby?.status === "playing" && (
            <span className="bg-primary-foreground/20 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono">
              {lobby.round_number}/{maxRounds}
            </span>
          )}
        </div>
      </div>

      {/* Word picker overlay */}
      {showWordPicker && (
        <div className="absolute inset-0 z-50 bg-background/90 flex items-center justify-center">
          <div className="nostalgia-card p-6 max-w-sm text-center space-y-4">
            <h3 className="font-display font-bold text-lg">Välj ett ord att rita!</h3>
            <div className="flex flex-col gap-2">
              {wordChoices.map(w => (
                <Button key={w} onClick={() => lobby?.status === "waiting" ? startWithWord(w) : pickWord(w)} className="font-display text-lg capitalize">
                  {w}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game finished */}
      {lobby?.status === "finished" && (() => {
        const sorted = [...players].sort((a, b) => b.score - a.score);
        const winner = sorted[0];
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-card p-8 text-center space-y-4 max-w-md">
              <Trophy className="w-16 h-16 mx-auto text-primary" />
              <h2 className="font-display font-bold text-2xl">Spelet är slut!</h2>
              <div className="space-y-2">
                {sorted.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {p.username}</span>
                    <span className="font-mono font-bold text-primary">{p.score}p</span>
                  </div>
                ))}
              </div>
              {winner && winner.user_id !== user?.id && (
                <GameOverVibes
                  winnerId={winner.user_id}
                  winnerName={winner.username}
                  hasVibed={hasVibedWinner}
                  onGiveVibe={async () => {
                    try {
                      await supabase.rpc("give_good_vibe", {
                        p_target_id: winner.user_id,
                        p_target_type: "user",
                      });
                      setHasVibedWinner(true);
                      toast({ title: "✨ Good Vibe skickad!" });
                    } catch {
                      toast({ title: "Kunde inte skicka vibe", variant: "destructive" });
                    }
                  }}
                />
              )}
              <Button onClick={handleLeave} className="font-display pressable">Tillbaka till lobbys</Button>
            </div>
          </div>
        );
      })()}

      {lobby?.status !== "finished" && (
        <div className={`flex-1 flex overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}>
          {/* Mobile tab toggle */}
          {isMobile && lobby?.status === "playing" && (
            <div className="flex border-b border-border bg-card shrink-0">
              <button
                onClick={() => setMobileTab("canvas")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${mobileTab === "canvas" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
              >
                <Paintbrush className="w-3.5 h-3.5" /> Rita
              </button>
              <button
                onClick={() => setMobileTab("chat")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${mobileTab === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Gissningar
                {guesses.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                    {guesses.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Canvas section — hidden on mobile when chat tab is active */}
          <div className={`flex-1 flex flex-col bg-muted/30 min-w-0 ${isMobile && mobileTab !== "canvas" && lobby?.status === "playing" ? "hidden" : ""}`}>
            {isDrawer && (
              <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 border-b border-border bg-card overflow-x-auto scrollbar-none shrink-0">
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); setIsEraser(false); hapticFeedback(); }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-transform shrink-0 pressable ${color === c && !isEraser ? "border-foreground scale-125" : "border-border"}`}
                      style={{ backgroundColor: c }}
                      aria-label={`Färg ${c}`}
                    />
                  ))}
                </div>
                <div className="w-px h-5 bg-border shrink-0" />
                <div className="flex items-center gap-1 shrink-0">
                  {BRUSH_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setBrushSize(s)}
                      className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded transition-colors shrink-0 ${brushSize === s ? "bg-primary/20 text-primary" : "hover:bg-muted"}`}
                    >
                      <div className="rounded-full bg-current" style={{ width: s, height: s }} />
                    </button>
                  ))}
                </div>
                <div className="w-px h-5 bg-border shrink-0" />
                <Button variant={isEraser ? "default" : "ghost"} size="icon" onClick={() => setIsEraser(!isEraser)} className="h-6 w-6 sm:h-7 sm:w-7 shrink-0">
                  <Eraser className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleClear} className="h-6 w-6 sm:h-7 sm:w-7 shrink-0">
                  <Paintbrush className="w-3.5 h-3.5" />
                </Button>
                {isDrawer && (
                  <Button variant="ghost" size="sm" onClick={() => advanceTurn()} className="h-6 sm:h-7 ml-auto text-xs shrink-0 whitespace-nowrap">
                    <SkipForward className="w-3 h-3 mr-1" /> Hoppa
                  </Button>
                )}
              </div>
            )}

            {isDrawer && lobby?.current_word && (
              <div className="text-center py-1 bg-primary/10 text-primary text-xs sm:text-sm font-display font-bold shrink-0">
                Rita: {lobby.current_word}
              </div>
            )}

            {!isDrawer && lobby?.status === "playing" && lobby?.current_word && (
              <div className="text-center py-1 bg-muted text-muted-foreground text-xs sm:text-sm font-display shrink-0">
                {lobby.current_word.replace(/./g, "_ ")}
              </div>
            )}

            {lobby?.status === "waiting" && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-sm mx-auto px-4">
                  <Paintbrush className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Väntar på att spelet ska starta...</p>
                  <DailyChallenge />
                  {isCreator && (
                    <Button onClick={handleStartRound} className="font-display pressable">
                      Starta runda!
                    </Button>
                  )}
                </div>
              </div>
            )}

            {lobby?.status === "playing" && (
              <div className={`flex-1 relative ${isMobile ? "min-h-[250px]" : ""}`} ref={containerRef}>
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full touch-none"
                  style={{ cursor: isDrawer ? "crosshair" : "default", touchAction: "none" }}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                />
              </div>
            )}

            {/* Mobile inline guess input below canvas */}
            {isMobile && lobby?.status === "playing" && mobileTab === "canvas" && !isDrawer && (
              <div className="p-2 border-t border-border flex gap-2 bg-card shrink-0">
                <Input
                  value={guessText}
                  onChange={(e) => setGuessText(e.target.value)}
                  placeholder="Skriv din gissning..."
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                />
                <Button size="icon" onClick={handleGuess} className="h-8 w-8 shrink-0">
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Chat & Players panel — on mobile it's a tab, on desktop a sidebar */}
          <div className={`${isMobile
            ? (mobileTab === "chat" || lobby?.status !== "playing" ? "flex flex-col flex-1" : "hidden")
            : "w-64 lg:w-72 border-l border-border flex flex-col shrink-0"
          } bg-card`}>
            <div className="border-b border-border shrink-0">
              <div className="bg-primary/10 px-3 py-1.5 flex items-center gap-2">
                <Trophy className="w-3 h-3 text-primary" />
                <span className="text-xs font-display font-bold text-primary">Poäng</span>
              </div>
              <div className="p-2 space-y-1 max-h-32 overflow-y-auto">
                {players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className={`truncate ${p.user_id === lobby?.current_drawer_id ? "text-primary font-bold" : "text-foreground"}`}>
                      {p.user_id === lobby?.current_drawer_id ? "🖌️ " : ""}{p.username}
                    </span>
                    <span className="font-mono text-muted-foreground">{p.score}p</span>
                  </div>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {guesses.map((g) => {
                  return (
                    <div key={g.id} className={`text-xs ${g.is_correct ? "text-primary font-bold" : "text-foreground"}`}>
                      <span className="font-bold">{g.username}:</span>{" "}
                      {g.is_correct
                        ? (isDrawer ? "✅ Någon gissade rätt!" : `✅ Rätt svar!`)
                        : (isDrawer ? "••••••" : g.guess)
                      }
                    </div>
                  );
                })}
                <div ref={guessEndRef} />
              </div>
            </ScrollArea>

            {lobby?.status === "playing" && (
              <div className="p-2 border-t border-border flex gap-2 shrink-0">
                {isDrawer ? (
                  <p className="text-xs text-muted-foreground italic px-2 py-1">Du ritar — vänta på gissningar</p>
                ) : (
                  <>
                    <Input
                      value={guessText}
                      onChange={(e) => setGuessText(e.target.value)}
                      placeholder="Skriv din gissning..."
                      className="text-sm h-8"
                      onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                    />
                    <Button size="icon" onClick={handleGuess} className="h-8 w-8 shrink-0">
                      <Send className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
