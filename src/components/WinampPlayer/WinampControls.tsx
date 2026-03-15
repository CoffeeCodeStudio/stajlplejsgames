import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WinampControlsProps {
  isPlaying: boolean;
  isRepeat: boolean;
  isShuffle: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRepeatToggle: () => void;
  onShuffleToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onButtonSound: () => void;
}

function RetroButton({ 
  onClick, 
  active = false, 
  children, 
  className,
  title 
}: { 
  onClick: () => void; 
  active?: boolean; 
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "relative p-2 rounded-sm transition-all",
        "bg-gradient-to-b from-[#4a4a6a] to-[#2a2a4a]",
        "border border-t-[#6a6a8a] border-l-[#6a6a8a] border-b-[#1a1a2a] border-r-[#1a1a2a]",
        "hover:from-[#5a5a7a] hover:to-[#3a3a5a]",
        "active:from-[#2a2a4a] active:to-[#4a4a6a]",
        "active:border-t-[#1a1a2a] active:border-l-[#1a1a2a] active:border-b-[#6a6a8a] active:border-r-[#6a6a8a]",
        active && "from-[#3a5a8a] to-[#2a4a7a] text-cyan-300",
        className
      )}
    >
      {children}
    </button>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function WinampControls({
  isPlaying,
  isRepeat,
  isShuffle,
  isMuted,
  volume,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onPrevious,
  onNext,
  onRepeatToggle,
  onShuffleToggle,
  onVolumeChange,
  onMuteToggle,
  onSeek,
  onButtonSound,
}: WinampControlsProps) {
  const handleButtonClick = (action: () => void) => {
    onButtonSound();
    action();
  };

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative h-3 bg-[#1a1a2e] rounded border border-[#2a2a4a] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-400"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-1">
        <RetroButton onClick={() => handleButtonClick(onPrevious)} title="Previous">
          <SkipBack className="w-4 h-4" />
        </RetroButton>
        
        {isPlaying ? (
          <RetroButton onClick={() => handleButtonClick(onPause)} title="Pause" className="px-3">
            <Pause className="w-5 h-5" />
          </RetroButton>
        ) : (
          <RetroButton onClick={() => handleButtonClick(onPlay)} title="Play" className="px-3">
            <Play className="w-5 h-5" />
          </RetroButton>
        )}
        
        <RetroButton onClick={() => handleButtonClick(onStop)} title="Stop">
          <Square className="w-4 h-4" />
        </RetroButton>
        
        <RetroButton onClick={() => handleButtonClick(onNext)} title="Next">
          <SkipForward className="w-4 h-4" />
        </RetroButton>

        <div className="w-2" />

        <RetroButton 
          onClick={() => handleButtonClick(onRepeatToggle)} 
          active={isRepeat}
          title="Repeat"
        >
          <Repeat className="w-4 h-4" />
        </RetroButton>
        
        <RetroButton 
          onClick={() => handleButtonClick(onShuffleToggle)} 
          active={isShuffle}
          title="Shuffle"
        >
          <Shuffle className="w-4 h-4" />
        </RetroButton>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onMuteToggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        
        <div className="flex-1 relative h-2 bg-[#1a1a2e] rounded border border-[#2a2a4a] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-600 to-green-400"
            style={{ width: `${isMuted ? 0 : volume * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        <span className="text-xs text-muted-foreground font-mono w-8">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
    </div>
  );
}
