/**
 * @module useKlotterCanvas
 * All drawing state, canvas logic, undo/redo, clear, download and publish
 * for the Klotterplanket component.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKlotter } from "@/hooks/useKlotter";
import { useAuth } from "@/hooks/useAuth";
import type { LayoutContext } from "@/components/SharedLayout";

/** Drawing point with color and size */
export interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface DrawAction {
  points: DrawPoint[];
}

export const COLORS = [
  "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981",
  "#EF4444", "#EC4899", "#F4D06F", "#FFFFFF", "#1e2540",
];
export const MOBILE_COLORS = [COLORS[0], COLORS[1], COLORS[2], COLORS[4], COLORS[7]];
export const BRUSH_SIZES = [4, 8, 14, 22, 32];
export const BG_COLOR = "#1e2540";

export function useKlotterCanvas() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(isMobile ? 12 : 8);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentAction, setCurrentAction] = useState<DrawPoint[]>([]);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishComment, setPublishComment] = useState("");
  const [activeTab, setActiveTab] = useState<"draw" | "gallery">("draw");
  const [isPublishing, setIsPublishing] = useState(false);

  const { klotter, loading: klotterLoading, uploadAndSaveKlotter } = useKlotter();
  const { user } = useAuth();
  const context = useOutletContext<LayoutContext>();
  const setHideNavbar = context?.setHideNavbar;

  // ---------------------------------------------------------------------------
  // Side-effects
  // ---------------------------------------------------------------------------

  // Hide navbar only when publish modal is open on mobile
  useEffect(() => {
    if (isMobile && setHideNavbar) {
      setHideNavbar(showPublishModal);
    }
    return () => { if (setHideNavbar) setHideNavbar(false); };
  }, [showPublishModal, isMobile, setHideNavbar]);

  // Initialize canvas with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, rect.width, rect.height);
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas redraw
  // ---------------------------------------------------------------------------

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (let i = 0; i <= historyIndex; i++) {
      const action = history[i];
      if (!action) continue;
      action.points.forEach((point, idx) => {
        if (idx === 0) return;
        const prev = action.points[idx - 1];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = point.color;
        ctx.lineWidth = point.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      });
    }
  }, [history, historyIndex]);

  useEffect(() => { redrawCanvas(); }, [historyIndex, redrawCanvas]);

  // ---------------------------------------------------------------------------
  // Pointer handlers
  // ---------------------------------------------------------------------------

  const getPointerPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getPointerPosition(e);
    if (!pos) return;
    setIsDrawing(true);
    setLastPoint(pos);
    setCurrentAction([{ ...pos, color: isEraser ? BG_COLOR : color, size: brushSize }]);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const pos = getPointerPosition(e);
    if (!ctx || !pos) return;

    const currentColor = isEraser ? BG_COLOR : color;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    setCurrentAction((prev) => [...prev, { ...pos, color: currentColor, size: brushSize }]);
    setLastPoint(pos);
  };

  const stopDrawing = () => {
    if (isDrawing && currentAction.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ points: currentAction });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIsDrawing(false);
    setLastPoint(null);
    setCurrentAction([]);
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const undo = () => { if (historyIndex >= 0) setHistoryIndex(historyIndex - 1); };
  const redo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

  const clearCanvas = () => {
    setHistory([]);
    setHistoryIndex(-1);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "klotterplanket.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const adjustBrushSize = (delta: number) => {
    const idx = BRUSH_SIZES.indexOf(brushSize);
    setBrushSize(BRUSH_SIZES[Math.max(0, Math.min(BRUSH_SIZES.length - 1, idx + delta))]);
  };

  const handlePublish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    setIsPublishing(true);
    const success = await uploadAndSaveKlotter(canvas.toDataURL("image/png"), publishComment);
    if (success) {
      setShowPublishModal(false);
      setPublishComment("");
      clearCanvas();
      setActiveTab("gallery");
    }
    setIsPublishing(false);
  };

  const selectColor = (c: string) => {
    setColor(c);
    setIsEraser(false);
  };

  const toggleEraser = () => setIsEraser(!isEraser);

  return {
    // Refs
    canvasRef,

    // Canvas state
    color,
    brushSize,
    isEraser,
    historyIndex,
    historyLength: history.length,

    // Pointer handlers
    startDrawing,
    draw,
    stopDrawing,

    // Actions
    undo,
    redo,
    clearCanvas,
    downloadCanvas,
    adjustBrushSize,
    selectColor,
    toggleEraser,

    // Publish
    showPublishModal,
    setShowPublishModal,
    publishComment,
    setPublishComment,
    handlePublish,
    isPublishing,

    // Tabs
    activeTab,
    setActiveTab,

    // Gallery data
    klotter,
    klotterLoading,

    // Misc
    isMobile,
    user,
  };
}
