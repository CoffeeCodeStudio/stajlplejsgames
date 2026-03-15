/**
 * @module KlotterCanvas
 * The drawing canvas area with pointer handlers.
 */
import React from "react";

interface KlotterCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
}

export function KlotterCanvas({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: KlotterCanvasProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ cursor: "crosshair" }}
      />
    </div>
  );
}
