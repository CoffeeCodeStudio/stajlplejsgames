import { useCallback, useRef } from "react";

type WinampSoundType = "startup" | "click" | "hover" | "play" | "stop" | "seek";

/**
 * Synthesises Winamp-inspired UI sounds via the Web Audio API.
 *
 * Supported sound types: `startup`, `click`, `hover`, `play`, `stop`, `seek`.
 * Can be globally enabled/disabled via `setEnabled`.
 *
 * @returns `playSound(type)`, `setEnabled(bool)`, `isEnabled()`.
 */
export function useWinampSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume: number = 0.2,
    delay: number = 0
  ) => {
    if (!enabledRef.current) return;
    
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  }, [getAudioContext]);

  const playSound = useCallback((type: WinampSoundType) => {
    if (!enabledRef.current) return;
    
    try {
      switch (type) {
        case "startup":
          // Classic Winamp-like startup jingle
          playTone(392, 0.1, "sine", 0.15, 0);      // G4
          playTone(440, 0.1, "sine", 0.15, 0.08);   // A4
          playTone(523, 0.15, "sine", 0.18, 0.16);  // C5
          playTone(659, 0.12, "sine", 0.15, 0.28);  // E5
          playTone(784, 0.25, "sine", 0.2, 0.38);   // G5
          break;

        case "click":
          // Short mechanical click
          playTone(1200, 0.03, "square", 0.08, 0);
          playTone(800, 0.02, "square", 0.05, 0.02);
          break;

        case "hover":
          // Subtle hover sound
          playTone(2000, 0.02, "sine", 0.03, 0);
          break;

        case "play":
          // Play button sound
          playTone(523, 0.08, "sine", 0.12, 0);    // C5
          playTone(659, 0.1, "sine", 0.12, 0.06);  // E5
          break;

        case "stop":
          // Stop button sound
          playTone(659, 0.08, "sine", 0.1, 0);     // E5
          playTone(523, 0.12, "sine", 0.1, 0.06);  // C5
          break;

        case "seek":
          // Seek/scrub sound
          playTone(1500, 0.015, "sawtooth", 0.04, 0);
          break;
      }
    } catch (e) {
      console.log("Could not play Winamp sound:", e);
    }
  }, [playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { playSound, setEnabled, isEnabled: () => enabledRef.current };
}
