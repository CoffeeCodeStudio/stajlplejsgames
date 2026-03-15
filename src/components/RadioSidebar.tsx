import { useState } from "react";
import { Radio, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRadio } from "@/contexts/RadioContext";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";

export function RadioSidebar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const {
    isPlaying,
    volume,
    isMuted,
    currentStation,
    nowPlaying,
    stations,
    play,
    pause,
    setVolume,
    toggleMute,
    selectStation,
  } = useRadio();

  if (!user) return null;

  return (
    <>
      {/* Collapsed tab - always visible on right edge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          "flex items-center gap-1 px-1 py-3",
          "bg-card/95 backdrop-blur-sm border border-r-0 border-border",
          "rounded-l-lg shadow-lg",
          "hover:bg-card transition-all duration-200",
          "group",
          isOpen && "opacity-0 pointer-events-none"
        )}
        aria-label="Öppna radio"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="flex flex-col items-center gap-1">
          <Radio 
            className={cn(
              "w-5 h-5 transition-colors",
              isPlaying ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-foreground"
            )} 
          />
          {isPlaying && (
            <div className="flex gap-0.5">
              <span className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </button>

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50",
          "w-72 bg-card/95 backdrop-blur-md border-l border-border",
          "shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border msn-header">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Radio</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Stäng radio"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Now Playing */}
        {currentStation && (
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-start gap-3">
              {nowPlaying?.albumArt ? (
                <img 
                  src={nowPlaying.albumArt} 
                  alt="Album art"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {nowPlaying?.title ? (
                  <>
                    <p className="font-medium text-sm truncate text-primary">
                      🎵 {nowPlaying.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nowPlaying.artist}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                      {currentStation.name}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm truncate">{currentStation.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentStation.genre}</p>
                    {nowPlaying?.currentShow && (
                      <p className="text-[10px] text-primary truncate mt-0.5">
                        📻 {nowPlaying.currentShow}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={isPlaying ? pause : play}
                className={cn(
                  "p-2.5 rounded-full transition-all",
                  "bg-primary text-primary-foreground",
                  "hover:scale-105 hover:shadow-lg hover:shadow-primary/30",
                  "active:scale-95"
                )}
                aria-label={isPlaying ? "Pausa" : "Spela"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label={isMuted ? "Slå på ljud" : "Stäng av ljud"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={([val]) => setVolume(val / 100)}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Station list */}
        <div className="flex-1 overflow-y-auto scrollbar-nostalgic p-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Kanaler
          </h3>
          <div className="space-y-1.5">
            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => selectStation(station)}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-all",
                  "hover:bg-muted/50 hover:border-primary/30",
                  "active:scale-[0.98]",
                  currentStation?.id === station.id
                    ? "bg-primary/10 border-primary/40 shadow-sm"
                    : "border-transparent"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{station.name}</p>
                    <p className="text-xs text-muted-foreground">{station.genre}</p>
                  </div>
                  {currentStation?.id === station.id && isPlaying && (
                    <div className="flex gap-0.5 ml-2">
                      <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="p-3 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Musiken spelar även när sidofältet är stängt
          </p>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
