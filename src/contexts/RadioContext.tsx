import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";

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

interface RadioContextType {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentStation: RadioStation | null;
  nowPlaying: NowPlaying | null;
  stations: RadioStation[];
  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  selectStation: (station: RadioStation) => Promise<void>;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const RADIO_STATIONS: RadioStation[] = [
  { id: "p3", name: "Sveriges Radio P3", url: "https://sverigesradio.se/topsy/direkt/164-hi.mp3", genre: "Pop/Hits", hasMetadata: true },
  { id: "p1", name: "Sveriges Radio P1", url: "https://sverigesradio.se/topsy/direkt/132-hi.mp3", genre: "Nyheter/Kultur", hasMetadata: true },
  { id: "p2", name: "Sveriges Radio P2", url: "https://sverigesradio.se/topsy/direkt/2562-hi.mp3", genre: "Klassiskt", hasMetadata: true },
  { id: "p4stockholm", name: "P4 Stockholm", url: "https://sverigesradio.se/topsy/direkt/701-hi.mp3", genre: "Lokalt", hasMetadata: true },
  { id: "dingatastockholm", name: "Din Gata", url: "https://sverigesradio.se/topsy/direkt/2576-hi.mp3", genre: "Urban", hasMetadata: true },
  { id: "starfm", name: "Star FM", url: "https://fm05-ice.stream.khz.se/fm05_mp3?platform=web", genre: "Hits/Classic rock" },
];

const RadioContext = createContext<RadioContextType | null>(null);

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error("useRadio must be used within a RadioProvider");
  }
  return context;
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

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
    if (!isPlaying || !currentStation?.hasMetadata) {
      return;
    }

    fetchRadioMetadata(currentStation.id);
    const interval = setInterval(() => {
      fetchRadioMetadata(currentStation.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [isPlaying, currentStation, fetchRadioMetadata]);

  const play = useCallback(async () => {
    if (!audioRef.current || !currentStation) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.log("Could not play radio:", e);
    }
  }, [currentStation]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (audioRef.current) {
        audioRef.current.volume = prev ? volume : 0;
      }
      return !prev;
    });
  }, [volume]);

  const selectStation = useCallback(async (station: RadioStation) => {
    setCurrentStation(station);
    setNowPlaying(null);
    
    if (audioRef.current) {
      audioRef.current.src = station.url;
      audioRef.current.load();
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.log("Could not play radio:", e);
      }
    }
  }, []);

  // Set initial volume on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return (
    <RadioContext.Provider
      value={{
        isPlaying,
        volume,
        isMuted,
        currentStation,
        nowPlaying,
        stations: RADIO_STATIONS,
        play,
        pause,
        setVolume,
        toggleMute,
        selectStation,
        audioRef,
      }}
    >
      {/* Global audio element - persists across navigation */}
      <audio ref={audioRef} preload="none" />
      {children}
    </RadioContext.Provider>
  );
}
