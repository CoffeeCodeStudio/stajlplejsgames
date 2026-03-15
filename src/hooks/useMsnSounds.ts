import { useCallback, useRef } from "react";

type SoundType = "message" | "nudge" | "online" | "offline" | "send" | "error";

/**
 * Synthesises retro MSN Messenger-style notification sounds via the Web Audio API.
 *
 * Generates tones procedurally (no audio files required). Supported sound types:
 * `message`, `send`, `nudge`, `online`, `offline`, `error`.
 *
 * @returns `playSound(type)` – trigger a sound effect by name.
 */
export function useMsnSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);

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
    volume: number = 0.3,
    delay: number = 0
  ) => {
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

  const playSound = useCallback((type: SoundType) => {
    try {
      switch (type) {
        case "message":
          // Classic MSN message received - two ascending tones
          playTone(880, 0.15, "sine", 0.25, 0);      // A5
          playTone(1100, 0.2, "sine", 0.25, 0.12);   // C#6
          playTone(1320, 0.25, "sine", 0.2, 0.25);   // E6
          break;

        case "send":
          // Quick subtle send confirmation
          playTone(600, 0.08, "sine", 0.15, 0);
          playTone(800, 0.1, "sine", 0.12, 0.05);
          break;

        case "nudge":
          // Buzzing nudge sound - rapid low frequency bursts
          for (let i = 0; i < 6; i++) {
            playTone(150 + (i % 2) * 50, 0.08, "square", 0.15, i * 0.1);
          }
          break;

        case "online":
          // Friend comes online - cheerful ascending chime
          playTone(523, 0.15, "sine", 0.2, 0);      // C5
          playTone(659, 0.15, "sine", 0.2, 0.1);    // E5
          playTone(784, 0.2, "sine", 0.25, 0.2);    // G5
          playTone(1047, 0.3, "sine", 0.2, 0.35);   // C6
          break;

        case "offline":
          // Friend goes offline - descending tones
          playTone(784, 0.15, "sine", 0.2, 0);      // G5
          playTone(659, 0.15, "sine", 0.18, 0.12);  // E5
          playTone(523, 0.25, "sine", 0.15, 0.24);  // C5
          break;

        case "error":
          // Error sound - discord-like
          playTone(300, 0.15, "square", 0.2, 0);
          playTone(250, 0.2, "square", 0.18, 0.15);
          break;
      }
    } catch (e) {
      console.log("Could not play sound:", e);
    }
  }, [playTone]);

  return { playSound };
}
