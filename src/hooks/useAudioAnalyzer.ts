import { useRef, useCallback, useState, useEffect } from "react";

export interface AudioData {
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  average: number;
}

/**
 * Connects a Web Audio API `AnalyserNode` to an `<audio>` element for real-time
 * frequency and waveform analysis.
 *
 * Used by the WinampPlayer visualiser to render MilkDrop-style effects.
 *
 * @returns `initializeAnalyzer(el)`, `getAudioData()`, `resumeContext()`, `isInitialized`.
 */
export function useAudioAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAnalyzer = useCallback((audioElement: HTMLAudioElement) => {
    if (audioElementRef.current === audioElement && isInitialized) {
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (!analyzerRef.current) {
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 512;
        analyzerRef.current.smoothingTimeConstant = 0.8;
      }

      if (!sourceRef.current && audioElement) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
        audioElementRef.current = audioElement;
        setIsInitialized(true);
      }
    } catch (e) {
      console.log("Audio analyzer initialization error:", e);
    }
  }, [isInitialized]);

  const getAudioData = useCallback((): AudioData | null => {
    if (!analyzerRef.current) return null;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const waveformData = new Uint8Array(bufferLength);

    analyzerRef.current.getByteFrequencyData(frequencyData);
    analyzerRef.current.getByteTimeDomainData(waveformData);

    // Calculate bass, mid, treble averages
    const bassEnd = Math.floor(bufferLength * 0.1);
    const midEnd = Math.floor(bufferLength * 0.5);

    let bassSum = 0, midSum = 0, trebleSum = 0, total = 0;

    for (let i = 0; i < bufferLength; i++) {
      const value = frequencyData[i];
      total += value;
      
      if (i < bassEnd) {
        bassSum += value;
      } else if (i < midEnd) {
        midSum += value;
      } else {
        trebleSum += value;
      }
    }

    return {
      frequencyData,
      waveformData,
      bass: bassSum / bassEnd / 255,
      mid: midSum / (midEnd - bassEnd) / 255,
      treble: trebleSum / (bufferLength - midEnd) / 255,
      average: total / bufferLength / 255,
    };
  }, []);

  const resumeContext = useCallback(async () => {
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    initializeAnalyzer,
    getAudioData,
    resumeContext,
    isInitialized,
  };
}
