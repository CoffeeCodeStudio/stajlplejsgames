/**
 * @module ClearViewToggle
 * Accessibility toggle: disables heavy visual effects (scanlines, blur, animations)
 * for users with dyslexia or motion sensitivity.
 */
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

export function ClearViewToggle() {
  const [clearView, setClearView] = useState(() => {
    return document.documentElement.classList.contains("clear-view");
  });

  useEffect(() => {
    if (clearView) {
      document.documentElement.classList.add("clear-view");
    } else {
      document.documentElement.classList.remove("clear-view");
    }
    try { localStorage.setItem("echo2000-clear-view", String(clearView)); } catch {}
  }, [clearView]);

  // Restore on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("echo2000-clear-view");
      if (stored === "true") {
        setClearView(true);
        document.documentElement.classList.add("clear-view");
      }
    } catch {}
  }, []);

  return (
    <button
      onClick={() => setClearView((v) => !v)}
      className="pressable flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 border border-border text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
      title={clearView ? "Stäng av Clear View" : "Aktivera Clear View — enklare vy utan effekter"}
      aria-label={clearView ? "Stäng av Clear View" : "Aktivera Clear View"}
    >
      {clearView ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      <span>Clear View</span>
    </button>
  );
}
