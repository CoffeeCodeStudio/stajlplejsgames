import { useRef, useEffect, useCallback, useState } from "react";
import { AudioData } from "@/hooks/useAudioAnalyzer";

interface MilkDropVisualizerProps {
  audioData: AudioData | null;
  isPlaying: boolean;
  mode: number;
  speed: number;
  colorShift: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function MilkDropVisualizer({ 
  audioData, 
  isPlaying, 
  mode, 
  speed,
  colorShift 
}: MilkDropVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getColor = useCallback((hue: number, saturation = 80, lightness = 60) => {
    return `hsl(${(hue + colorShift) % 360}, ${saturation}%, ${lightness}%)`;
  }, [colorShift]);

  const createParticle = useCallback((x: number, y: number, intensity: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 2 + 1) * intensity;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: getColor(Math.random() * 360),
      size: Math.random() * 4 + 2,
    };
  }, [getColor]);

  const drawWaveform = useCallback((
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    data: AudioData
  ) => {
    const { waveformData, bass, mid, treble } = data;
    const centerY = height / 2;
    
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    
    // Multiple wave layers
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      ctx.strokeStyle = getColor(layer * 120 + timeRef.current * 50, 70, 50 + layer * 10);
      
      const layerOffset = (layer - 1) * 30;
      const sliceWidth = width / waveformData.length;
      
      for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0;
        const y = centerY + (v - 1) * (height / 4) * (bass + 0.5) + layerOffset;
        const x = i * sliceWidth;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }, [getColor]);

  const drawFrequencyBars = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioData
  ) => {
    const { frequencyData, bass } = data;
    const barCount = 64;
    const barWidth = width / barCount - 2;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * frequencyData.length);
      const value = frequencyData[dataIndex] / 255;
      const barHeight = value * height * 0.6;
      
      const hue = (i / barCount * 360 + timeRef.current * 100) % 360;
      const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
      gradient.addColorStop(0, getColor(hue, 90, 70));
      gradient.addColorStop(0.5, getColor(hue + 30, 80, 50));
      gradient.addColorStop(1, getColor(hue + 60, 70, 30));
      
      ctx.fillStyle = gradient;
      
      // Mirror bars from center
      const x = centerX + (i - barCount / 2) * (barWidth + 2);
      ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      
      // Add glow
      ctx.shadowColor = getColor(hue, 100, 60);
      ctx.shadowBlur = 10 * bass;
    }
    ctx.shadowBlur = 0;
  }, [getColor]);

  const drawPsychedelic = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioData
  ) => {
    const { bass, mid, treble, average } = data;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Spiral patterns
    const spirals = 8;
    for (let s = 0; s < spirals; s++) {
      ctx.beginPath();
      const baseHue = (s * 45 + timeRef.current * 60) % 360;
      
      for (let i = 0; i < 360; i += 2) {
        const angle = (i * Math.PI / 180) + timeRef.current * speed + s * (Math.PI / spirals);
        const radius = 50 + i * 0.8 * (bass + 0.5) + Math.sin(angle * 3) * 30 * mid;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.strokeStyle = getColor(baseHue, 80, 50 + treble * 30);
      ctx.lineWidth = 1.5 + bass * 2;
      ctx.stroke();
    }

    // Center pulse
    const pulseRadius = 50 + average * 100;
    const pulseGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, pulseRadius
    );
    pulseGradient.addColorStop(0, getColor(timeRef.current * 100 % 360, 100, 70));
    pulseGradient.addColorStop(0.5, getColor((timeRef.current * 100 + 60) % 360, 80, 50));
    pulseGradient.addColorStop(1, "transparent");
    
    ctx.fillStyle = pulseGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
  }, [getColor, speed]);

  const drawParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioData
  ) => {
    const { bass, mid, average } = data;
    const centerX = width / 2;
    const centerY = height / 2;

    // Add new particles based on audio
    if (bass > 0.3) {
      for (let i = 0; i < Math.floor(bass * 10); i++) {
        particlesRef.current.push(createParticle(centerX, centerY, bass));
      }
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx * speed;
      p.y += p.vy * speed;
      p.life -= 0.01;
      p.size *= 0.99;
      
      if (p.life <= 0) return false;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('60%)', `${p.life * 60}%)`);
      ctx.fill();
      
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2;
      
      return true;
    });
    ctx.shadowBlur = 0;

    // Keep particle count reasonable
    if (particlesRef.current.length > 300) {
      particlesRef.current = particlesRef.current.slice(-200);
    }
  }, [createParticle, speed]);

  const drawCircularSpectrum = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: AudioData
  ) => {
    const { frequencyData, bass } = data;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.2;
    const barCount = 128;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * frequencyData.length);
      const value = frequencyData[dataIndex] / 255;
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const barLength = value * baseRadius * 1.5;
      
      const hue = (i / barCount * 360 + timeRef.current * 80) % 360;
      
      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + barLength);
      const y2 = centerY + Math.sin(angle) * (baseRadius + barLength);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = getColor(hue, 80, 50 + value * 30);
      ctx.lineWidth = 2 + bass * 2;
      ctx.lineCap = "round";
      ctx.stroke();
      
      // Inner reflection
      const x3 = centerX + Math.cos(angle) * (baseRadius - barLength * 0.3);
      const y3 = centerY + Math.sin(angle) * (baseRadius - barLength * 0.3);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x3, y3);
      ctx.strokeStyle = getColor(hue + 180, 60, 40);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Center orb
    const orbGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, baseRadius * 0.8
    );
    orbGradient.addColorStop(0, getColor(timeRef.current * 50 % 360, 100, 80));
    orbGradient.addColorStop(0.6, getColor((timeRef.current * 50 + 120) % 360, 70, 40));
    orbGradient.addColorStop(1, "transparent");
    
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.8 * (1 + bass * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }, [getColor]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Fade effect for trails
    ctx.fillStyle = "rgba(10, 10, 20, 0.15)";
    ctx.fillRect(0, 0, width, height);

    if (audioData && isPlaying) {
      timeRef.current += 0.016 * speed;

      switch (mode) {
        case 0:
          drawWaveform(ctx, width, height, audioData);
          break;
        case 1:
          drawFrequencyBars(ctx, width, height, audioData);
          break;
        case 2:
          drawPsychedelic(ctx, width, height, audioData);
          break;
        case 3:
          drawParticles(ctx, width, height, audioData);
          break;
        case 4:
          drawCircularSpectrum(ctx, width, height, audioData);
          break;
        default:
          // Mix of effects
          drawPsychedelic(ctx, width, height, audioData);
          drawParticles(ctx, width, height, audioData);
      }
    } else {
      // Idle animation
      timeRef.current += 0.008;
      const centerX = width / 2;
      const centerY = height / 2;
      
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const radius = 50 + i * 30 + Math.sin(timeRef.current + i) * 20;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = getColor(i * 60 + timeRef.current * 30, 50, 30);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    animationRef.current = requestAnimationFrame(render);
  }, [audioData, isPlaying, mode, speed, getColor, drawWaveform, drawFrequencyBars, drawPsychedelic, drawParticles, drawCircularSpectrum]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-[#0a0a14]"
      style={{ imageRendering: "auto" }}
    />
  );
}
