import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Maximize2, 
  Minimize2, 
  X, 
  Settings, 
  Upload,
  Music,
  Palette,
  Zap,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MilkDropVisualizer } from "./MilkDropVisualizer";
import { WinampEqualizer } from "./WinampEqualizer";
import { WinampControls } from "./WinampControls";
import { useAudioAnalyzer, AudioData } from "@/hooks/useAudioAnalyzer";
import { useWinampSounds } from "@/hooks/useWinampSounds";

interface Track {
  name: string;
  artist: string;
  url: string;
  isRadio?: boolean;
}

interface RadioStation {
  id: string;
  name: string;
  url: string;
  genre: string;
  hasMetadata?: boolean;
}

interface NowPlaying {
  title?: string;
  artist?: string;
  albumArt?: string;
  currentShow?: string;
}

interface WinampPlayerProps {
  onClose?: () => void;
  className?: string;
}

// Radio stations
const RADIO_STATIONS: RadioStation[] = [
  { id: "p3", name: "Sveriges Radio P3", url: "https://sverigesradio.se/topsy/direkt/164-hi.mp3", genre: "Pop/Hits", hasMetadata: true },
  { id: "p1", name: "Sveriges Radio P1", url: "https://sverigesradio.se/topsy/direkt/132-hi.mp3", genre: "Nyheter/Kultur", hasMetadata: true },
  { id: "p2", name: "Sveriges Radio P2", url: "https://sverigesradio.se/topsy/direkt/2562-hi.mp3", genre: "Klassiskt", hasMetadata: true },
  { id: "p4stockholm", name: "P4 Stockholm", url: "https://sverigesradio.se/topsy/direkt/701-hi.mp3", genre: "Lokalt", hasMetadata: true },
  { id: "dingatastockholm", name: "Din Gata", url: "https://sverigesradio.se/topsy/direkt/2576-hi.mp3", genre: "Urban", hasMetadata: true },
  { id: "starfm", name: "Star FM", url: "https://fm05-ice.stream.khz.se/fm05_mp3?platform=web", genre: "Hits/Classic rock" },
];

const VISUALIZATION_MODES = [
  { id: 0, name: "Waveform", icon: "〰️" },
  { id: 1, name: "Bars", icon: "📊" },
  { id: 2, name: "Psychedelic", icon: "🌀" },
  { id: 3, name: "Particles", icon: "✨" },
  { id: 4, name: "Circular", icon: "⭕" },
  { id: 5, name: "Mixed", icon: "🎆" },
];

const SKINS = [
  { id: "classic", name: "Classic Blue", primary: "#2a2a4a", accent: "#4a8aaa" },
  { id: "dark", name: "Midnight", primary: "#1a1a2a", accent: "#6a4a8a" },
  { id: "matrix", name: "Matrix", primary: "#0a1a0a", accent: "#00cc66" },
  { id: "sunset", name: "Sunset", primary: "#2a1a1a", accent: "#cc6633" },
  { id: "cyber", name: "Cyberpunk", primary: "#1a0a1a", accent: "#ff00ff" },
];

export function WinampPlayer({ onClose, className }: WinampPlayerProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [visualMode, setVisualMode] = useState(2);
  const [visualSpeed, setVisualSpeed] = useState(1);
  const [colorShift, setColorShift] = useState(0);
  const [currentSkin, setCurrentSkin] = useState(SKINS[0]);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRadio, setShowRadio] = useState(false);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [currentRadioStation, setCurrentRadioStation] = useState<RadioStation | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();

  const { initializeAnalyzer, getAudioData, resumeContext, isInitialized } = useAudioAnalyzer();
  const { playSound, setEnabled: setSoundsActive } = useWinampSounds();

  // Play startup sound on mount
  useEffect(() => {
    if (soundsEnabled) {
      playSound("startup");
    }
  }, []);

  useEffect(() => {
    setSoundsActive(soundsEnabled);
  }, [soundsEnabled, setSoundsActive]);

  // Generate simulated audio data for radio (since CORS blocks real analysis)
  const generateSimulatedAudioData = useCallback((): AudioData => {
    const bufferLength = 256;
    const frequencyData = new Uint8Array(bufferLength);
    const waveformData = new Uint8Array(bufferLength);
    
    const time = Date.now() / 1000;
    
    // Generate random but smooth frequency data
    for (let i = 0; i < bufferLength; i++) {
      const noise = Math.sin(time * 3 + i * 0.1) * 0.3 + Math.random() * 0.7;
      const bassBoost = i < bufferLength * 0.1 ? 1.5 : 1;
      frequencyData[i] = Math.floor(noise * 180 * bassBoost);
      waveformData[i] = 128 + Math.sin(time * 5 + i * 0.05) * 50;
    }
    
    return {
      frequencyData,
      waveformData,
      bass: 0.4 + Math.sin(time * 2) * 0.3,
      mid: 0.5 + Math.sin(time * 3) * 0.2,
      treble: 0.3 + Math.sin(time * 4) * 0.2,
      average: 0.5 + Math.sin(time * 2.5) * 0.2,
    };
  }, []);

  const updateAudioData = useCallback(() => {
    if (isPlaying) {
      if (isRadioPlaying) {
        // Use simulated data for radio (CORS blocks real analysis)
        setAudioData(generateSimulatedAudioData());
      } else {
        const data = getAudioData();
        setAudioData(data);
      }
    }
    animationRef.current = requestAnimationFrame(updateAudioData);
  }, [isPlaying, isRadioPlaying, getAudioData, generateSimulatedAudioData]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateAudioData);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateAudioData]);

  // Fetch metadata for current radio station
  const fetchRadioMetadata = useCallback(async (stationId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/radio-proxy?action=metadata&station=${stationId}`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNowPlaying({
          title: data.nowPlaying?.title,
          artist: data.nowPlaying?.artist,
          albumArt: data.nowPlaying?.albumArt,
          currentShow: data.currentShow,
        });
      }
    } catch (e) {
      console.log("Could not fetch radio metadata:", e);
    }
  }, []);

  // Poll for metadata updates when radio is playing
  useEffect(() => {
    if (!isRadioPlaying || !currentRadioStation?.hasMetadata) {
      setNowPlaying(null);
      return;
    }

    // Fetch immediately
    fetchRadioMetadata(currentRadioStation.id);

    // Then poll every 30 seconds
    const interval = setInterval(() => {
      fetchRadioMetadata(currentRadioStation.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [isRadioPlaying, currentRadioStation, fetchRadioMetadata]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newTracks: Track[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file);
        const nameParts = file.name.replace(/\.[^/.]+$/, "").split(" - ");
        
        newTracks.push({
          name: nameParts.length > 1 ? nameParts[1] : nameParts[0],
          artist: nameParts.length > 1 ? nameParts[0] : "Unknown Artist",
          url,
        });
      }
    });

    if (newTracks.length > 0) {
      setPlaylist((prev) => [...prev, ...newTracks]);
      if (!currentTrack) {
        loadTrack(newTracks[0], 0);
      }
    }
  };

  const loadTrack = (track: Track, index: number) => {
    setCurrentTrack(track);
    setCurrentIndex(index);
    setIsRadioPlaying(track.isRadio || false);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
    }
  };

  const playRadioStation = async (station: RadioStation) => {
    const radioTrack: Track = {
      name: station.name,
      artist: station.genre,
      url: station.url,
      isRadio: true,
    };
    
    setCurrentTrack(radioTrack);
    setIsRadioPlaying(true);
    setCurrentRadioStation(station);
    setShowRadio(false);
    setNowPlaying(null);
    
    if (audioRef.current) {
      audioRef.current.src = station.url;
      audioRef.current.load();
      
      // Don't initialize analyzer for radio - CORS blocks it
      // Visualizations will be simulated instead
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        playSound("play");
      } catch (e) {
        console.log("Could not play radio:", e);
      }
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    if (!isInitialized) {
      initializeAnalyzer(audioRef.current);
    }
    
    await resumeContext();
    await audioRef.current.play();
    setIsPlaying(true);
    playSound("play");
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    playSound("stop");
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    
    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    
    loadTrack(playlist[nextIndex], nextIndex);
    if (isPlaying) {
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    
    let prevIndex: number;
    if (currentTime > 3) {
      // Restart current track if more than 3 seconds in
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }
    
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    }
    
    loadTrack(playlist[prevIndex], prevIndex);
    if (isPlaying) {
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      playSound("seek");
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  const handleButtonSound = () => {
    playSound("click");
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg overflow-hidden border-2 shadow-2xl transition-all duration-300",
        isMaximized ? "fixed inset-4 z-50" : "w-full max-w-md",
        className
      )}
      style={{
        backgroundColor: currentSkin.primary,
        borderColor: currentSkin.accent,
      }}
    >
      {/* Hidden audio element - no crossOrigin for radio compatibility */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="none"
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Title bar */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ 
          background: `linear-gradient(to bottom, ${currentSkin.accent}40, ${currentSkin.primary})`,
          borderColor: `${currentSkin.accent}40`,
        }}
      >
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4" style={{ color: currentSkin.accent }} />
          <span className="text-sm font-bold tracking-wide">ECHO2000 PLAYER</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-red-500/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visualizer */}
      <div className={cn(
        "relative transition-all duration-300",
        isMaximized ? "flex-1" : "h-48"
      )}>
        <MilkDropVisualizer
          audioData={audioData}
          isPlaying={isPlaying}
          mode={visualMode}
          speed={visualSpeed}
          colorShift={colorShift}
        />
        
        {/* Track info overlay */}
        {currentTrack && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded px-3 py-2">
            <div className="flex items-center gap-3">
              {/* Album art for radio */}
              {nowPlaying?.albumArt && (
                <img 
                  src={nowPlaying.albumArt} 
                  alt="Album art"
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                {/* Now playing song info (for radio with metadata) */}
                {isRadioPlaying && nowPlaying?.title ? (
                  <>
                    <p className="text-sm font-medium truncate text-green-400">
                      🎵 {nowPlaying.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nowPlaying.artist}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 truncate">
                      {currentTrack.name} {nowPlaying.currentShow && `• ${nowPlaying.currentShow}`}
                    </p>
                  </>
                ) : isRadioPlaying && nowPlaying?.currentShow ? (
                  <>
                    <p className="text-sm font-medium truncate">{currentTrack.name}</p>
                    <p className="text-xs text-green-400 truncate">📻 {nowPlaying.currentShow}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{currentTrack.artist}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium truncate">{currentTrack.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                    {isRadioPlaying && (
                      <p className="text-[10px] text-green-400">📻 Live</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Visualization mode buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          {VISUALIZATION_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setVisualMode(mode.id);
                handleButtonSound();
              }}
              title={mode.name}
              className={cn(
                "w-7 h-7 rounded text-sm flex items-center justify-center transition-all",
                visualMode === mode.id
                  ? "bg-white/30 scale-110"
                  : "bg-black/40 hover:bg-black/60"
              )}
            >
              {mode.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Equalizer display */}
      <div className="px-3 py-2">
        <WinampEqualizer audioData={audioData} isPlaying={isPlaying} />
      </div>

      {/* Controls */}
      <div className="px-3 pb-3">
        <WinampControls
          isPlaying={isPlaying}
          isRepeat={isRepeat}
          isShuffle={isShuffle}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onRepeatToggle={() => setIsRepeat(!isRepeat)}
          onShuffleToggle={() => setIsShuffle(!isShuffle)}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onSeek={handleSeek}
          onButtonSound={handleButtonSound}
        />
      </div>

      {/* Action buttons */}
      <div 
        className="flex border-t"
        style={{ borderColor: `${currentSkin.accent}40` }}
      >
        <button
          onClick={() => {
            handleButtonSound();
            fileInputRef.current?.click();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 transition-colors hover:bg-white/5 border-r"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Ladda upp</span>
        </button>
        
        <button
          onClick={() => {
            handleButtonSound();
            setShowRadio(!showRadio);
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 transition-colors hover:bg-white/5",
            showRadio && "bg-white/10"
          )}
        >
          <Radio className="w-4 h-4" />
          <span className="text-sm">Radio</span>
        </button>
      </div>

      {/* Radio stations panel */}
      {showRadio && (
        <div 
          className="border-t p-3 space-y-2"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4" style={{ color: currentSkin.accent }} />
            Radiokanaler
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {RADIO_STATIONS.map((station) => (
              <button
                key={station.id}
                onClick={() => {
                  handleButtonSound();
                  playRadioStation(station);
                }}
                className={cn(
                  "p-2 text-left rounded border transition-all hover:bg-white/10",
                  currentTrack?.name === station.name && isRadioPlaying
                    ? "bg-white/15 border-white/30"
                    : "border-white/10"
                )}
              >
                <p className="text-sm font-medium truncate">{station.name}</p>
                <p className="text-xs text-muted-foreground">{station.genre}</p>
                {currentTrack?.name === station.name && isPlaying && (
                  <span className="text-xs text-green-400 animate-pulse">▶ Live</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playlist */}
      {playlist.length > 0 && (
        <div 
          className="max-h-32 overflow-y-auto border-t scrollbar-nostalgic"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          {playlist.map((track, index) => (
            <button
              key={`${track.url}-${index}`}
              onClick={() => {
                handleButtonSound();
                loadTrack(track, index);
                handlePlay();
              }}
              className={cn(
                "w-full px-3 py-1.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2",
                currentIndex === index && "bg-white/5"
              )}
            >
              {currentIndex === index && isPlaying && (
                <span className="text-xs animate-pulse">▶</span>
              )}
              <span className="truncate flex-1">{track.artist} - {track.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div 
          className="border-t p-3 space-y-3"
          style={{ borderColor: `${currentSkin.accent}40` }}
        >
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Inställningar
          </h4>
          
          {/* Sounds toggle */}
          <label className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Retro-ljud
            </span>
            <button
              onClick={() => setSoundsEnabled(!soundsEnabled)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                soundsEnabled ? "bg-green-600" : "bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                  soundsEnabled ? "left-5" : "left-0.5"
                )}
              />
            </button>
          </label>

          {/* Visual speed */}
          <div className="space-y-1">
            <label className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Visualiseringshastighet
            </label>
            <input
              type="range"
              min={0.2}
              max={3}
              step={0.1}
              value={visualSpeed}
              onChange={(e) => setVisualSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Color shift */}
          <div className="space-y-1">
            <label className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Färgskiftning
            </label>
            <input
              type="range"
              min={0}
              max={360}
              value={colorShift}
              onChange={(e) => setColorShift(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Skins */}
          <div className="space-y-2">
            <label className="text-sm">Tema</label>
            <div className="flex flex-wrap gap-2">
              {SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => {
                    handleButtonSound();
                    setCurrentSkin(skin);
                  }}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-all",
                    currentSkin.id === skin.id
                      ? "ring-2 ring-white/50"
                      : "opacity-70 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor: skin.primary,
                    borderColor: skin.accent,
                    color: skin.accent,
                  }}
                >
                  {skin.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
