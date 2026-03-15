/**
 * @module Klotterplanket
 * Drawing / graffiti wall – thin render shell.
 *
 * All canvas state & logic lives in {@link useKlotterCanvas}.
 * Visual sub-sections are delegated to dedicated components.
 */
import { cn } from "@/lib/utils";
import { useKlotterCanvas, COLORS, MOBILE_COLORS, BRUSH_SIZES } from "@/hooks/useKlotterCanvas";

import { KlotterHeader } from "./KlotterHeader";
import { KlotterToolbar } from "./KlotterToolbar";
import { KlotterCanvas } from "./KlotterCanvas";
import { KlotterGallery } from "./KlotterGallery";
import { KlotterPublishModal } from "./KlotterPublishModal";

export function Klotterplanket() {
  const k = useKlotterCanvas();
  const toolbarColors = k.isMobile ? MOBILE_COLORS : COLORS;

  return (
    <div className={cn("flex-1 flex flex-col overflow-hidden", !k.isMobile && "p-4")}>
      <div className={cn("nostalgia-card flex-1 flex flex-col overflow-hidden", k.isMobile && "mx-2 my-2 rounded-lg")}>
        <KlotterHeader
          isMobile={k.isMobile}
          activeTab={k.activeTab}
          onTabChange={k.setActiveTab}
          canPublish={k.historyIndex >= 0}
          onPublish={() => k.setShowPublishModal(true)}
          galleryCount={k.klotter.length}
        />

        {k.activeTab === "draw" ? (
          <>
            <KlotterToolbar
              colors={toolbarColors}
              activeColor={k.color}
              brushSize={k.brushSize}
              brushSizes={BRUSH_SIZES}
              isEraser={k.isEraser}
              canUndo={k.historyIndex >= 0}
              canRedo={k.historyIndex < k.historyLength - 1}
              canPublish={k.historyIndex >= 0}
              isMobile={k.isMobile}
              onColorChange={k.selectColor}
              onEraserToggle={k.toggleEraser}
              onBrushSizeAdjust={k.adjustBrushSize}
              onUndo={k.undo}
              onRedo={k.redo}
              onClear={k.clearCanvas}
              onDownload={k.downloadCanvas}
              onPublish={() => k.setShowPublishModal(true)}
            />
            <KlotterCanvas
              canvasRef={k.canvasRef}
              onPointerDown={k.startDrawing}
              onPointerMove={k.draw}
              onPointerUp={k.stopDrawing}
            />
          </>
        ) : (
          <div className={cn("flex-1 overflow-y-auto scrollbar-nostalgic", k.isMobile ? "p-2" : "p-4")}>
            <KlotterGallery
              klotter={k.klotter}
              loading={k.klotterLoading}
              isMobile={k.isMobile}
              onSwitchToDraw={() => k.setActiveTab("draw")}
            />
          </div>
        )}

        {!k.isMobile && (
          <div className="p-2 border-t border-border text-center text-xs text-muted-foreground">
            ✨ Klottra fritt • Rita med musen eller pekskärm
          </div>
        )}
      </div>

      {k.showPublishModal && (
        <KlotterPublishModal
          isMobile={k.isMobile}
          isPublishing={k.isPublishing}
          canPublish={!!k.user}
          comment={k.publishComment}
          onCommentChange={k.setPublishComment}
          onPublish={k.handlePublish}
          onClose={() => k.setShowPublishModal(false)}
          previewDataUrl={k.canvasRef.current?.toDataURL("image/png")}
        />
      )}
    </div>
  );
}
