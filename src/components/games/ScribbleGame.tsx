import { useState, useRef, useEffect, useCallback } from "react";
import { useScribbleGame } from "@/hooks/useScribble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Eraser, Paintbrush, Users, Trophy, Timer, SkipForward, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { playCorrectSound, fireConfetti, playTickSound, playBuzzerSound, playPenDownSound, playScribbleBurst, isMuted, setMuted } from "@/lib/game-effects";

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
const ROUND_TIME = 60;

const WORD_LIST = [
  "hund", "katt", "sol", "hus", "bil", "träd", "blomma", "fisk",
  "bok", "stol", "bord", "telefon", "glass", "pizza", "gitarr",
  "kanin", "elefant", "cykel", "banan", "jordgubbe", "paraply",
  "robot", "raket", "fjäril", "snögubbe", "drake", "krona",
  "hjärta", "stjärna", "måne", "berg", "sjö", "båt", "flygplan",
  "dator", "mus", "nycklar", "lampa", "klocka", "regnbåge",
  "fotboll", "skateboard", "tårta", "clown", "dinosaurie",
];

export function ScribbleGame({ lobbyId, onLeave, guestId, guestUsername }: ScribbleGameProps) {
  const { lobby, players, guesses, joinLobby, submitGuess, leaveLobby } = useScribbleGame(lobbyId, guestId, guestUsername);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [guessText, setGuessText] = useState("");
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [showWordPicker, setShowWordPicker] = useState(false);
  const wordPickerRoundRef = useRef<number | null>(null);
  const guessEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMobile = useIsMobile();
  const lastSeenCorrectRef = useRef<string | null>(null);
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const roundEndedRef = useRef(false);
  const [roundEnding, setRoundEnding] = useState(false);
  const [roundWinner, setRoundWinner] = useState<{ username: string; word: string } | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const toggleMute = () => { const next = !muted; setMutedState(next); setMuted(next); };

  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const currentStrokeRef = useRef<DrawPoint[]>([]);
  const pendingPoints = useRef<DrawPoint[]>([]);
  const broadcastBatchRef = useRef<DrawPoint[]>([]);
  const lastBroadcastTime = useRef(0);
  const lastSoundTimeRef = useRef(0);
  const rafId = useRef<number>(0);
  const canvasMetricsRef = useRef({ cssWidth: 1, cssHeight: 1, dpr: 1 });

  const isDrawer = lobby?.current_drawer_id === guestId;
  const isCreator = lobby?.creator_id === guestId;
  const maxRounds = players.length > 0 ? players.length * 2 : 4;

  useEffect(() => { joinLobby(); }, [lobbyId]); // eslint-disable-line

  // When the lobby drawer changes (e.g. drawer left), show word picker for new drawer
  const prevDrawerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!lobby || lobby.status !== 'playing') return;
    const currentDrawer = lobby.current_drawer_id;
    
    // Detect drawer change (someone left, turn advanced server-side)
    if (prevDrawerRef.current !== null && currentDrawer !== prevDrawerRef.current) {
      // New drawer is me and no word is set yet — show word picker
      if (currentDrawer === guestId && !lobby.current_word) {
        const round = lobby.round_number || 0;
        if (wordPickerRoundRef.current !== round) {
          wordPickerRoundRef.current = round;
          setWordChoices(getRandomWords(3));
          setShowWordPicker(true);
        }
        clearCanvas();
      }
    }
    prevDrawerRef.current = currentDrawer ?? null;
  }, [lobby?.current_drawer_id, lobby?.status, lobby?.current_word, lobby?.round_number, guestId]); // eslint-disable-line

  // If lobby is finished (all left), auto-leave
  useEffect(() => {
    if (lobby?.status === 'finished') {
      // Small delay to let the UI show the finished state
      const t = setTimeout(() => onLeave(), 3000);
      return () => clearTimeout(t);
    }
  }, [lobby?.status]); // eslint-disable-line

  useEffect(() => {
    const el = guessEndRef.current;
    if (el) {
      const scrollParent = el.closest('[data-radix-scroll-area-viewport]') || el.parentElement;
      if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      }
    }
    // Notify drawer when someone guesses correctly
    if (isDrawer && guesses.length > 0) {
      const latest = guesses[guesses.length - 1];
      if (latest.is_correct && lastSeenCorrectRef.current !== latest.id) {
        lastSeenCorrectRef.current = latest.id;
        toast({ title: `✅ ${latest.username} gissade rätt!` });
      }
    }
  }, [guesses]);

  const applyCanvasDefaults = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round(rect.height * dpr));

    canvasMetricsRef.current = { cssWidth: rect.width, cssHeight: rect.height, dpr };

    if (import.meta.env.DEV) {
      console.debug("[Scribble] resizeCanvas", {
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        attr: { width: canvas.width, height: canvas.height },
        targetAttr: { width: nextWidth, height: nextHeight },
        dpr,
      });
    }

    if (canvas.width === nextWidth && canvas.height === nextHeight) return;

    let snapshot: HTMLCanvasElement | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      const snapshotCtx = snapshot.getContext("2d");
      if (snapshotCtx) {
        snapshotCtx.drawImage(canvas, 0, 0);
      }
    }

    canvas.width = nextWidth;
    canvas.height = nextHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, nextWidth, nextHeight);
    ctx.scale(dpr, dpr);
    applyCanvasDefaults(ctx);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (snapshot) {
      ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, rect.width, rect.height);
    }
  }, [applyCanvasDefaults]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rafId = requestAnimationFrame(() => resizeCanvas());

    if (import.meta.env.DEV) {
      const canvasStyle = window.getComputedStyle(canvas);
      const containerStyle = window.getComputedStyle(container);
      console.debug("[Scribble] layoutCheck", {
        canvasRect: canvas.getBoundingClientRect(),
        containerRect: container.getBoundingClientRect(),
        canvasPosition: canvasStyle.position,
        containerPosition: containerStyle.position,
        canvasTransform: canvasStyle.transform,
        containerTransform: containerStyle.transform,
      });
    }

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(container);
    ro.observe(canvas);

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
    };
  }, [resizeCanvas, lobby?.status, isMobile]);

  const drawStroke = useCallback((points: DrawPoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    applyCanvasDefaults(ctx);

    const { cssWidth, cssHeight } = canvasMetricsRef.current;
    const useNormalizedCoords = points.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
    const toCanvasPoint = (p: DrawPoint) =>
      useNormalizedCoords
        ? { x: p.x * cssWidth, y: p.y * cssHeight }
        : { x: p.x, y: p.y };

    if (points.length === 1) {
      const p = toCanvasPoint(points[0]);
      ctx.fillStyle = points[0].color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(points[0].size / 2, 1), 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    for (let i = 1; i < points.length; i++) {
      const prev = toCanvasPoint(points[i - 1]);
      const curr = toCanvasPoint(points[i]);
      ctx.beginPath();
      ctx.strokeStyle = points[i].color;
      ctx.lineWidth = points[i].size;
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
  }, [applyCanvasDefaults]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { cssWidth, cssHeight, dpr } = canvasMetricsRef.current;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssWidth || canvas.width / (dpr || 1), cssHeight || canvas.height / (dpr || 1));
    currentStrokeRef.current = [];
    pendingPoints.current = [];
  }, []);

  const getPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    // Always use a fresh getBoundingClientRect — this is the most
    // reliable method across mobile/desktop/iframe contexts.
    // clientX/clientY are always viewport-relative, matching getBoundingClientRect.
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };

    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    return {
      x: Math.min(Math.max(localX / rect.width, 0), 1),
      y: Math.min(Math.max(localY / rect.height, 0), 1),
    };
  }, []);

  const flushDraw = useCallback(() => {
    if (pendingPoints.current.length <= 1) {
      pendingPoints.current = pendingPoints.current.slice(-1);
      rafId.current = 0;
      return;
    }

    drawStroke(pendingPoints.current);
    pendingPoints.current = pendingPoints.current.slice(-1);
    rafId.current = 0;
  }, [drawStroke]);

  const requestFlush = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(flushDraw);
  }, [flushDraw]);

  // Timer
  const advancedForRoundRef = useRef<number | null>(null);
  const roundAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forceNextRound = useCallback(async (roundToAdvance: number) => {
    const { data: lobbyState, error: lobbyError } = await supabase
      .from('scribble_lobbies')
      .select('round_number,current_drawer_id,status')
      .eq('id', lobbyId)
      .single();

    if (lobbyError || !lobbyState) return;
    if ((lobbyState.round_number ?? 0) !== roundToAdvance) return;
    if (!['playing', 'showing_result'].includes(lobbyState.status)) return;

    const { data: orderedPlayers, error: playersError } = await supabase
      .from('scribble_players')
      .select('user_id, username, joined_at')
      .eq('lobby_id', lobbyId)
      .order('joined_at', { ascending: true });

    if (playersError || !orderedPlayers) return;

    if (orderedPlayers.length === 0) {
      await supabase.from('scribble_lobbies').update({
        status: 'finished',
        current_word: null,
        current_drawer_id: null,
      }).eq('id', lobbyId);
      return;
    }

    const maxRoundsForLobby = orderedPlayers.length * 2;
    const nextRound = roundToAdvance + 1;

    if (nextRound > maxRoundsForLobby) {
      await supabase.from('scribble_lobbies').update({
        status: 'finished',
        current_word: null,
        current_drawer_id: null,
      }).eq('id', lobbyId);
      toast({ title: "🏆 Spelet är slut!" });
      return;
    }

    const currentIdx = orderedPlayers.findIndex(p => p.user_id === lobbyState.current_drawer_id);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % orderedPlayers.length : 0;
    const nextDrawer = orderedPlayers[nextIdx];

    if (nextDrawer.user_id === guestId && wordPickerRoundRef.current !== nextRound) {
      wordPickerRoundRef.current = nextRound;
      setWordChoices(getRandomWords(3));
      setShowWordPicker(true);
    }

    console.log("Nu byter vi runda!");

    await supabase.from('scribble_lobbies').update({
      current_drawer_id: nextDrawer.user_id,
      round_number: nextRound,
      current_word: null,
      status: 'playing',
    })
      .eq('id', lobbyId)
      .eq('round_number', roundToAdvance)
      .in('status', ['playing', 'showing_result']);

    clearCanvas();
  }, [clearCanvas, guestId, lobbyId, toast]);

  useEffect(() => {
    if (lobby?.status !== "playing") return;
    const currentRound = lobby?.round_number ?? 0;
    setTimeLeft(ROUND_TIME);
    advancedForRoundRef.current = null;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if ((isDrawer || isCreator) && advancedForRoundRef.current !== currentRound) {
            advancedForRoundRef.current = currentRound;
            playBuzzerSound();
            void forceNextRound(currentRound);
          }
          return 0;
        }
        const next = prev - 1;
        if (next > 0 && next <= 10) {
          playTickSound();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [forceNextRound, lobby?.round_number, lobby?.status]);

  useEffect(() => {
    if (lobby?.status !== 'showing_result') return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(0);
  }, [lobby?.status]);

  useEffect(() => {
    return () => {
      if (roundAdvanceTimeoutRef.current) {
        clearTimeout(roundAdvanceTimeoutRef.current);
        roundAdvanceTimeoutRef.current = null;
      }
    };
  }, []);

  // Broadcast channel
  const broadcastChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!lobbyId) return;
    const channel = supabase.channel(`scribble-draw-${lobbyId}`);

    channel
      .on('broadcast', { event: 'draw' }, ({ payload }) => {
        if (payload?.drawer_id === guestId) return;
        const points = Array.isArray(payload?.points) ? payload.points as DrawPoint[] : [];
        drawStroke(points);
      })
      .on('broadcast', { event: 'clear' }, () => {
        clearCanvas();
      })
      .subscribe();

    broadcastChannel.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [lobbyId, guestId, drawStroke, clearCanvas]);

  const startDrawing = (e: React.PointerEvent) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    // Don't use setPointerCapture — it breaks coordinate mapping on mobile browsers.

    activePointerIdRef.current = e.pointerId;
    isDrawingRef.current = true;
    playPenDownSound();

    const pos = getPos(e);

    if (import.meta.env.DEV) {
      const rect = canvas.getBoundingClientRect();
      console.debug("[Scribble] pointerMap", {
        clientX: e.clientX,
        clientY: e.clientY,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        normalized: pos,
      });
    }

    const point: DrawPoint = {
      ...pos,
      color: isEraser ? "#ffffff" : color,
      size: brushSize,
    };

    currentStrokeRef.current = [point];
    pendingPoints.current = [point, point];
    requestFlush();
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawer || !isDrawingRef.current) return;
    if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    const pos = getPos(e);
    const point: DrawPoint = {
      ...pos,
      color: isEraser ? "#ffffff" : color,
      size: brushSize,
    };

    const last = currentStrokeRef.current[currentStrokeRef.current.length - 1];
    if (last && Math.abs(last.x - point.x) < 0.0005 && Math.abs(last.y - point.y) < 0.0005) return;

    currentStrokeRef.current.push(point);
    pendingPoints.current.push(point);
    broadcastBatchRef.current.push(point);
    playScribbleBurst();
    requestFlush();

    // Send live broadcast every 5 points or every 80ms
    const now = performance.now();
    if (broadcastBatchRef.current.length >= 5 || now - lastBroadcastTime.current > 80) {
      broadcastChannel.current?.send({
        type: 'broadcast',
        event: 'draw',
        payload: { points: broadcastBatchRef.current, drawer_id: guestId, coord_space: 'normalized' },
      });
      broadcastBatchRef.current = [];
      lastBroadcastTime.current = now;
    }
  };

  const stopDrawing = (e?: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    if (e && activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = 0;
    }

    if (pendingPoints.current.length > 1) {
      drawStroke(pendingPoints.current);
    }

    // Flush remaining broadcast batch
    if (broadcastBatchRef.current.length > 0) {
      broadcastChannel.current?.send({
        type: 'broadcast',
        event: 'draw',
        payload: { points: broadcastBatchRef.current, drawer_id: guestId, coord_space: 'normalized' },
      });
      broadcastBatchRef.current = [];
    }

    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    currentStrokeRef.current = [];
    pendingPoints.current = [];
  };

  const handleClear = () => {
    clearCanvas();
    broadcastChannel.current?.send({ type: 'broadcast', event: 'clear', payload: {} });
  };

  const handleGuess = async () => {
    if (!guessText.trim() || hasGuessedCorrectly) return;
    const isCorrect = await submitGuess(guessText.trim());
    if (isCorrect) {
      setHasGuessedCorrectly(true);
      playCorrectSound();
      fireConfetti();
      toast({ title: "🎉 Rätt svar!" });
    }
    setGuessText("");
  };

  // Auto-advance turn when a correct guess is detected (once per round)
  const lastAdvancedGuessRef = useRef<string | null>(null);
  useEffect(() => {
    if (!lobby || lobby.status !== 'playing') return;

    const correctGuess = guesses.filter(g => g.is_correct).pop();
    if (!correctGuess) return;
    if (lastAdvancedGuessRef.current === correctGuess.id) return;
    if (roundEndedRef.current) return;

    roundEndedRef.current = true;
    lastAdvancedGuessRef.current = correctGuess.id;
    setRoundEnding(true);
    setRoundWinner({ username: correctGuess.username, word: lobby.current_word || '?' });

    // Kill the round timer immediately on correct guess
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(0);

    const currentRound = lobby.round_number || 0;
    const iAmResponsible = isDrawer || isCreator;

    // Force temporary result status for synchronized pause state (only one client writes)
    if (iAmResponsible) {
      void supabase
        .from('scribble_lobbies')
        .update({ status: 'showing_result' })
        .eq('id', lobbyId)
        .eq('round_number', currentRound)
        .eq('status', 'playing');
    }

    // After 3s: force next round (only drawer/host triggers)
    if (iAmResponsible) {
      if (roundAdvanceTimeoutRef.current) {
        clearTimeout(roundAdvanceTimeoutRef.current);
      }
      roundAdvanceTimeoutRef.current = setTimeout(async () => {
        await forceNextRound(currentRound);

        // Fallback: if still stuck in showing_result after 1s, retry
        setTimeout(async () => {
          const { data } = await supabase
            .from('scribble_lobbies')
            .select('status, round_number')
            .eq('id', lobbyId)
            .single();
          if (data && data.status === 'showing_result' && data.round_number === currentRound) {
            console.warn('[Scribble] Fallback: lobby stuck in showing_result, retrying forceNextRound');
            await forceNextRound(currentRound);
          }
        }, 1000);
      }, 3000);
    }
  }, [forceNextRound, guesses, lobby, lobbyId, isDrawer, isCreator]);

  // Reset round state when round changes
  useEffect(() => {
    roundEndedRef.current = false;
    setHasGuessedCorrectly(false);
    setRoundEnding(false);
    setRoundWinner(null);
  }, [lobby?.round_number]);

  const advanceTurn = async () => {
    if (!lobby) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(0);
    await forceNextRound(lobby.round_number || 0);
  };

  const getRandomWords = (n: number) => {
    const choices: string[] = [];
    const used = new Set<string>();
    while (choices.length < n) {
      const w = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      if (!used.has(w)) { choices.push(w); used.add(w); }
    }
    return choices;
  };

  const pickWord = async (word: string) => {
    setShowWordPicker(false);
    setWordChoices([]);
    await supabase.from('scribble_lobbies').update({ current_word: word }).eq('id', lobbyId);
    clearCanvas();
  };

  const startWithWord = async (word: string) => {
    setShowWordPicker(false);
    setWordChoices([]);
    wordPickerRoundRef.current = 1;
    await supabase.from('scribble_lobbies').update({
      status: 'playing', current_word: word, current_drawer_id: guestId, round_number: 1,
    }).eq('id', lobbyId);
    clearCanvas();
  };

  const handleLeave = async () => {
    await leaveLobby();
    onLeave();
  };

  const timerColor = timeLeft <= 10 ? "text-red-400" : timeLeft <= 20 ? "text-orange-400" : "text-white/80";
  const timerPanic = timeLeft > 0 && timeLeft <= 10;

  // === RENDER ===
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {/* Top bar — compact */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-2 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={handleLeave} className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
          <h2 className="font-pixel text-[8px] text-primary-foreground truncate">{lobby?.title || "Scribble"}</h2>
        </div>
        <div className="flex items-center gap-2 text-primary-foreground/80 text-xs shrink-0">
          {lobby?.status === "playing" && (
            <span className={`flex items-center gap-1 font-mono font-bold ${timerColor} ${timerPanic ? "animate-pulse scale-110" : ""}`}
              style={timerPanic ? { animationDuration: "0.5s" } : undefined}
            >
              <Timer className="w-3 h-3" />
              {timeLeft}s
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {players.length}
          </span>
          {lobby?.status === "playing" && (
            <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
              {lobby.round_number}/{maxRounds}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20 shrink-0" title={muted ? "Slå på ljud" : "Stäng av ljud"}>
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Word picker overlay */}
      {showWordPicker && (
        <div className="absolute inset-0 z-50 bg-background/90 flex items-center justify-center">
          <div className="retro-panel p-6 max-w-sm text-center space-y-4">
            <h3 className="font-pixel text-xs">Välj ett ord att rita!</h3>
            <div className="flex flex-col gap-2">
              {wordChoices.map(w => (
                <Button key={w} onClick={() => lobby?.status === "waiting" ? startWithWord(w) : pickWord(w)} className="text-lg capitalize">
                  {w}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game finished — Podium */}
      {lobby?.status === "finished" && (() => {
        const sorted = [...players].sort((a, b) => b.score - a.score);
        const podiumOrder = sorted.length >= 3
          ? [sorted[1], sorted[0], sorted[2]]
          : sorted.length === 2
            ? [sorted[1], sorted[0]]
            : [sorted[0]];
        const podiumHeights = ['h-20', 'h-28', 'h-14'];
        const podiumColors = ['bg-muted/60', 'bg-primary/20', 'bg-muted/40'];
        const podiumLabels = ['🥈', '🥇', '🥉'];
        const podiumPositions = sorted.length >= 3 ? [1, 0, 2] : sorted.length === 2 ? [1, 0] : [0];

        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="retro-panel p-6 text-center space-y-6 max-w-md w-full animate-fade-in">
              <div className="space-y-1">
                <h2 className="font-pixel text-sm">🏆 Spelet är slut!</h2>
                <p className="text-xs text-muted-foreground">Grattis till alla spelare!</p>
              </div>

              {/* Podium visualization */}
              <div className="flex items-end justify-center gap-2 pt-4">
                {podiumOrder.map((player, visualIdx) => {
                  if (!player) return null;
                  const rank = podiumPositions[visualIdx];
                  const height = podiumHeights[rank] || 'h-14';
                  const bg = podiumColors[rank] || 'bg-muted/40';
                  const medal = podiumLabels[rank] || `${rank + 1}.`;
                  const isFirst = rank === 0;

                  return (
                    <div key={player.id} className="flex flex-col items-center gap-1" style={{ minWidth: isFirst ? 100 : 80 }}>
                      {isFirst && <span className="text-2xl animate-pulse">👑</span>}
                      <span className="text-lg">{medal}</span>
                      <span className={`font-bold text-xs truncate max-w-[90px] ${isFirst ? 'text-primary' : 'text-foreground'}`}>
                        {player.username}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">{player.score}p</span>
                      <div className={`${height} w-full rounded-t-lg ${bg} border border-border/50 flex items-end justify-center pb-1 transition-all`}>
                        <span className="font-pixel text-[10px] text-muted-foreground">{rank + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full scoreboard below podium */}
              {sorted.length > 3 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  {sorted.slice(3).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between text-xs px-2">
                      <span className="text-muted-foreground">{i + 4}. {p.username}</span>
                      <span className="font-mono text-muted-foreground">{p.score}p</span>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleLeave} className="mt-2">Tillbaka till lobbys</Button>
            </div>
          </div>
        );
      })()}

      {/* Active game layout */}
      {lobby?.status !== "finished" && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Main content: canvas + sidebar */}
          <div className={`flex-1 flex overflow-hidden min-h-0 ${isMobile ? "flex-col" : ""}`}>
            {/* Canvas section */}
            <div className={`flex flex-col min-w-0 min-h-0 ${isMobile ? "" : "flex-1"}`} style={isMobile && lobby?.status === "playing" ? { flex: "0 0 55%" } : isMobile ? { flex: "1" } : undefined}>
              {/* Toolbar */}
              {isDrawer && (
                <div className="flex items-center gap-1 p-1.5 border-b border-border bg-card overflow-x-auto scrollbar-none shrink-0">
                  <div className="flex items-center gap-1 shrink-0">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setColor(c); setIsEraser(false); }}
                        className={`w-5 h-5 rounded-full border-2 transition-transform shrink-0 ${color === c && !isEraser ? "border-foreground scale-125" : "border-border"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <div className="flex items-center gap-0.5 shrink-0">
                    {BRUSH_SIZES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setBrushSize(s)}
                        className={`flex items-center justify-center w-6 h-6 rounded ${brushSize === s ? "bg-primary/20 text-primary" : "hover:bg-muted"}`}
                      >
                        <div className="rounded-full bg-current" style={{ width: s, height: s }} />
                      </button>
                    ))}
                  </div>
                  <div className="w-px h-4 bg-border shrink-0" />
                  <Button variant={isEraser ? "default" : "ghost"} size="icon" onClick={() => setIsEraser(!isEraser)} className="h-6 w-6 shrink-0">
                    <Eraser className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleClear} className="h-6 w-6 shrink-0">
                    <Paintbrush className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => advanceTurn()} disabled={roundEnding} className="h-6 ml-auto text-xs shrink-0 whitespace-nowrap">
                    <SkipForward className="w-3 h-3 mr-1" /> Hoppa
                  </Button>
                </div>
              )}

              {/* Word hint */}
              {isDrawer && lobby?.current_word && (
                <div className="text-center py-1 bg-primary/10 text-primary text-xs font-pixel shrink-0">
                  Rita: {lobby.current_word}
                </div>
              )}
              {!isDrawer && lobby?.status === "playing" && lobby?.current_word && (
                <div className="text-center py-1 bg-muted text-muted-foreground text-xs shrink-0">
                  {lobby.current_word.replace(/./g, "_ ")}
                </div>
              )}

              {/* Waiting state — player list + host start */}
              {lobby?.status === "waiting" && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-sm mx-auto px-4 w-full">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/50" />
                    <h3 className="font-pixel text-[10px] text-foreground">Spelare i lobbyn</h3>
                    <div className="space-y-1.5">
                      {players.map((p) => {
                        const isHost = p.user_id === lobby?.creator_id;
                        const joinedAgo = Date.now() - new Date(p.joined_at).getTime();
                        const isNew = !isHost && lobby?.status === 'waiting' && joinedAgo < 30_000;
                        return (
                          <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-sm">
                            <span className="truncate">
                              {isHost ? "👑 " : ""}{p.username}
                              {isNew && <span className="ml-1.5 text-[10px]">🆕</span>}
                            </span>
                            {isHost && <span className="text-[10px] text-muted-foreground font-pixel">HOST</span>}
                          </div>
                        );
                      })}
                    </div>
                    {lobby?.creator_id === guestId ? (
                      <>
                        <Button
                          disabled={players.length < 2}
                          onClick={() => {
                            if (wordPickerRoundRef.current !== 0) {
                              wordPickerRoundRef.current = 0;
                              setWordChoices(getRandomWords(3));
                            }
                            setShowWordPicker(true);
                          }}
                        >
                          Starta spelet
                        </Button>
                        {players.length < 2 && (
                          <p className="text-xs text-muted-foreground">Minst 2 spelare krävs för att starta</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Väntar på host...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Canvas — fills all remaining space, aspect-ratio preserved by container */}
              {lobby?.status === "playing" && (
                <div className="flex-1 relative min-h-0 bg-muted/20" ref={containerRef}>
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                    style={{
                      cursor: isDrawer ? "crosshair" : "default",
                      touchAction: "none",
                      pointerEvents: isDrawer ? "auto" : "none",
                    }}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                    onPointerLeave={stopDrawing}
                    onTouchStart={(e) => e.preventDefault()}
                    onTouchEnd={(e) => e.preventDefault()}
                  />
                  {/* Round winner banner */}
                  {roundEnding && roundWinner && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/70 pointer-events-none">
                      <div className="text-center space-y-1 p-4">
                        <p className="font-pixel text-sm text-green-500">🎉 {roundWinner.username} gissade rätt!</p>
                        <p className="text-xs text-muted-foreground">Rätt ord var: <span className="font-bold text-foreground">{roundWinner.word}</span></p>
                        <p className="text-[10px] text-muted-foreground/60 animate-pulse">Nästa runda om 3 sekunder...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Sidebar — always visible */}
            <div className={`${isMobile
              ? "flex flex-col flex-1 min-h-0"
              : "w-48 border-l border-border flex flex-col shrink-0"
            } bg-card`}>
              {/* Scoreboard */}
              <div className="border-b border-border shrink-0">
                <div className="bg-primary/10 px-2 py-1 flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-pixel text-primary">Poäng</span>
                </div>
                <div className="p-1.5 space-y-0.5 max-h-24 overflow-y-auto">
                  {players.map((p) => {
                    const secsSinceLastSeen = (Date.now() - new Date(p.last_seen).getTime()) / 1000;
                    const isDisconnected = secsSinceLastSeen > 60;
                    return (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className={`truncate ${isDisconnected ? "text-muted-foreground/50 line-through" : p.user_id === lobby?.current_drawer_id ? "text-primary font-bold" : "text-foreground"}`}>
                          {p.user_id === lobby?.current_drawer_id ? "🖌️ " : ""}{isDisconnected ? "⚡ " : ""}{p.username}
                        </span>
                        <span className="font-mono text-muted-foreground">{p.score}p</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guesses */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-2 space-y-1">
                  {guesses.map((g) => {
                    const isSystem = g.guess.startsWith('📤') || g.guess.startsWith('⚡') || g.guess.startsWith('👋');
                    if (isSystem) {
                      return (
                        <div key={g.id} className="text-[10px] text-muted-foreground text-center italic py-0.5">
                          {g.guess}
                        </div>
                      );
                    }
                    const time = new Date(g.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={g.id}
                        className={`rounded px-2 py-1 text-xs max-w-[90%] ${
                          g.is_correct
                            ? "bg-green-500/20 border border-green-500/40"
                            : "bg-muted/60"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-1">
                          <span className={`font-bold text-[11px] ${g.is_correct ? "text-green-600 dark:text-green-400" : "text-foreground/70"}`}>
                            {g.username}
                          </span>
                          <span className="text-[9px] text-muted-foreground/60 tabular-nums shrink-0">{time}</span>
                        </div>
                        <span className="text-foreground">
                          {g.is_correct
                            ? "✅ Rätt svar!"
                            : g.guess
                          }
                        </span>
                      </div>
                    );
                  })}
                  <div ref={guessEndRef} />
                </div>
              </ScrollArea>

              {/* Guess input */}
              {lobby?.status === "playing" && (
                <div className="p-1.5 border-t border-border flex gap-1.5 shrink-0">
                  {isDrawer ? (
                    <p className="text-[10px] text-muted-foreground italic px-1 py-1">Du ritar — vänta på gissningar</p>
                  ) : hasGuessedCorrectly ? (
                    <p className="text-xs text-green-400 font-bold px-1 py-1">🎉 Rätt! Väntar på nästa runda...</p>
                  ) : (
                    <>
                      <Input
                        value={guessText}
                        onChange={(e) => setGuessText(e.target.value)}
                        placeholder="Gissa..."
                        className="text-sm h-7"
                        onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                      />
                      <Button size="icon" onClick={handleGuess} className="h-7 w-7 shrink-0">
                        <Send className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
