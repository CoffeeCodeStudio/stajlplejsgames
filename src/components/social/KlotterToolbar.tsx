/** Drawing toolbar with color picker, brush size, eraser, undo/redo, clear, download, publish */
import { Eraser, Palette, Trash2, Download, Undo, Redo, Minus, Plus, Send } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface KlotterToolbarProps {
  colors: string[];
  activeColor: string;
  brushSize: number;
  brushSizes: number[];
  isEraser: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canPublish: boolean;
  isMobile: boolean;
  onColorChange: (color: string) => void;
  onEraserToggle: () => void;
  onBrushSizeAdjust: (delta: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onPublish: () => void;
}

export function KlotterToolbar({
  colors, activeColor, brushSize, brushSizes, isEraser, canUndo, canRedo, canPublish,
  isMobile, onColorChange, onEraserToggle, onBrushSizeAdjust, onUndo, onRedo, onClear, onDownload, onPublish,
}: KlotterToolbarProps) {
  if (isMobile) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={cn("w-8 h-8 rounded-full transition-all border-2", activeColor === c && !isEraser ? "border-foreground scale-110" : "border-transparent")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant={isEraser ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={onEraserToggle}><Eraser className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo}><Undo className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onClear}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
      <div className="flex items-center gap-1">
        <Palette className="w-4 h-4 text-muted-foreground mr-1" />
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={cn("w-7 h-7 rounded-full transition-all border-2", activeColor === c && !isEraser ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:scale-105")}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="h-6 w-px bg-border mx-2" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onBrushSizeAdjust(-1)} disabled={brushSize === brushSizes[0]}><Minus className="w-4 h-4" /></Button>
        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center" style={{ backgroundColor: isEraser ? "#1e2540" : activeColor }}>
          <div className="rounded-full bg-foreground/80" style={{ width: Math.min(brushSize, 24), height: Math.min(brushSize, 24) }} />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onBrushSizeAdjust(1)} disabled={brushSize === brushSizes[brushSizes.length - 1]}><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="h-6 w-px bg-border mx-2" />
      <Button variant={isEraser ? "default" : "ghost"} size="sm" onClick={onEraserToggle} className="gap-1.5">
        <Eraser className="w-4 h-4" /><span className="hidden sm:inline">Sudd</span>
      </Button>
      <div className="h-6 w-px bg-border mx-2" />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUndo} disabled={!canUndo}><Undo className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRedo} disabled={!canRedo}><Redo className="w-4 h-4" /></Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Rensa</span></Button>
      <Button variant="outline" size="sm" onClick={onDownload} className="gap-1.5"><Download className="w-4 h-4" /><span className="hidden sm:inline">Spara</span></Button>
      <Button size="sm" onClick={onPublish} disabled={!canPublish} className="gap-1.5 bg-primary hover:bg-primary/90"><Send className="w-4 h-4" />Publicera</Button>
    </div>
  );
}
