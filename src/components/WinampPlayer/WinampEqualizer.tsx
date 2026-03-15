import { AudioData } from "@/hooks/useAudioAnalyzer";

interface WinampEqualizerProps {
  audioData: AudioData | null;
  isPlaying: boolean;
}

export function WinampEqualizer({ audioData, isPlaying }: WinampEqualizerProps) {
  const barCount = 20;
  
  const getBarHeight = (index: number): number => {
    if (!audioData || !isPlaying) {
      return 5 + Math.random() * 3; // Idle state
    }
    
    const dataIndex = Math.floor((index / barCount) * audioData.frequencyData.length);
    return (audioData.frequencyData[dataIndex] / 255) * 100;
  };

  const getBarColor = (index: number, height: number): string => {
    const percentage = height / 100;
    
    if (percentage > 0.8) {
      return "#ff3030"; // Red for peaks
    } else if (percentage > 0.6) {
      return "#ffcc00"; // Yellow for high
    } else if (percentage > 0.3) {
      return "#00cc66"; // Green for mid
    }
    return "#00aa55"; // Dark green for low
  };

  return (
    <div className="flex items-end justify-center gap-[2px] h-16 bg-[#1a1a2e] rounded p-2 border border-[#2a2a4a]">
      {Array.from({ length: barCount }).map((_, index) => {
        const height = getBarHeight(index);
        const color = getBarColor(index, height);
        
        return (
          <div
            key={index}
            className="w-[6px] transition-all duration-75 rounded-t-sm"
            style={{
              height: `${Math.max(height, 5)}%`,
              background: `linear-gradient(to top, ${color}, ${color}cc)`,
              boxShadow: isPlaying && height > 50 ? `0 0 4px ${color}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}
