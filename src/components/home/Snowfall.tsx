/**
 * @module Snowfall
 * Lightweight canvas-based snowfall effect.
 * Two layers: behind content (z-0) and in front (z-10, pointer-events-none).
 * Toggle button in top-right corner. Respects Clear View mode.
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { Snowflake } from "lucide-react";

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  wind: number;
  opacity: number;
}

function createFlakes(count: number, w: number, h: number): Flake[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2.5 + 0.8,
    speed: Math.random() * 0.6 + 0.2,
    wind: Math.random() * 0.3 - 0.15,
    opacity: Math.random() * 0.4 + 0.25,
  }));
}

function drawFlakes(
  ctx: CanvasRenderingContext2D,
  flakes: Flake[],
  w: number,
  h: number
) {
  for (const f of flakes) {
    f.y += f.speed;
    f.x += f.wind + Math.sin(f.y * 0.01) * 0.3;
    if (f.y > h) {
      f.y = -4;
      f.x = Math.random() * w;
    }
    if (f.x > w) f.x = 0;
    if (f.x < 0) f.x = w;

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
    ctx.fill();
  }
}

interface SnowCanvasProps {
  flakeCount: number;
  className?: string;
}

function SnowCanvas({ flakeCount, className = "" }: SnowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakesRef = useRef<Flake[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w;
      canvas.height = h;
      flakesRef.current = createFlakes(flakeCount, w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      drawFlakes(ctx, flakesRef.current, w, h);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [flakeCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
}

export function Snowfall() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("echo2000-snow") !== "off";
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setEnabled((v) => {
      const next = !v;
      try { localStorage.setItem("echo2000-snow", next ? "on" : "off"); } catch {}
      return next;
    });
  }, []);

  // Respect Clear View mode
  const isClearView =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("clear-view");

  const showSnow = enabled && !isClearView;

  return (
    <>
      {/* Back layer — behind content */}
      {showSnow && <SnowCanvas flakeCount={40} className="z-0 pointer-events-none" />}

      {/* Front layer — subtle foreground depth */}
      {showSnow && <SnowCanvas flakeCount={15} className="z-10 pointer-events-none opacity-50" />}

      {/* Toggle button */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 z-20 pressable flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium min-h-[36px] transition-colors"
        style={{
          background: "hsl(var(--glass-bg))",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid hsl(var(--glass-border))",
          color: enabled ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
        }}
        title={enabled ? "Stäng av snöfall" : "Sätt på snöfall"}
        aria-label={enabled ? "Stäng av snöfall" : "Sätt på snöfall"}
      >
        <Snowflake className="w-3.5 h-3.5" />
        <span>{enabled ? "❄️" : "☀️"}</span>
      </button>
    </>
  );
}
