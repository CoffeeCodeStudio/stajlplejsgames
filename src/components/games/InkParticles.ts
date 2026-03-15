/**
 * @module InkParticles
 * Lightweight ink-splatter particle system for the Scribble canvas.
 * Spawns tiny colored dots when drawing speed exceeds a threshold.
 * Rendered on a separate overlay canvas (pointer-events: none).
 */
import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 80;

export function useInkParticles(containerRef: React.RefObject<HTMLElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);
  const lastPos = useRef<{ x: number; y: number; t: number } | null>(null);

  // Create overlay canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Animation loop
    const loop = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.98;
        p.life--;

        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", ` / ${alpha})`).replace("rgb", "rgb");
        // Fallback: use globalAlpha
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;

        return p.life > 0;
      });

      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      canvas.remove();
    };
  }, [containerRef]);

  /**
   * Call on each pointer-move while drawing.
   * Spawns particles when drawing speed exceeds threshold.
   */
  const onDrawMove = useCallback((x: number, y: number, color: string, brushSize: number) => {
    const now = performance.now();
    const last = lastPos.current;

    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      const dt = Math.max(1, now - last.t);
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;

      // Only spawn particles when drawing fast
      if (speed > 0.8 && particles.current.length < MAX_PARTICLES) {
        const count = Math.min(3, Math.floor(speed * 1.5));
        for (let i = 0; i < count; i++) {
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 2;
          const spd = speed * (0.5 + Math.random() * 1.5);
          particles.current.push({
            x,
            y,
            vx: Math.cos(angle) * spd * 2,
            vy: Math.sin(angle) * spd * 2 - 1,
            r: Math.random() * (brushSize * 0.3) + 1,
            color,
            life: 20 + Math.floor(Math.random() * 15),
            maxLife: 35,
          });
        }
      }
    }

    lastPos.current = { x, y, t: now };
  }, []);

  const resetLastPos = useCallback(() => {
    lastPos.current = null;
  }, []);

  return { onDrawMove, resetLastPos };
}

/**
 * Trigger haptic feedback on supported mobile devices.
 * @param duration Vibration duration in ms (default 10ms — subtle)
 */
export function hapticFeedback(duration = 10) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch {
    // Silent fallback
  }
}
