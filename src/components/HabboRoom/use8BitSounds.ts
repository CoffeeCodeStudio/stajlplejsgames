import { useCallback, useRef } from 'react';

// Simple 8-bit sound synthesis using Web Audio API
export const use8BitSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'square') => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [getAudioContext]);

  const playSitSound = useCallback(() => {
    // Low "thump" sound for sitting
    playTone(150, 0.1);
    setTimeout(() => playTone(100, 0.15), 50);
  }, [playTone]);

  const playWaveSound = useCallback(() => {
    // Cheerful ascending notes
    playTone(400, 0.1);
    setTimeout(() => playTone(500, 0.1), 100);
    setTimeout(() => playTone(600, 0.15), 200);
  }, [playTone]);

  const playDanceSound = useCallback(() => {
    // Funky beat pattern
    playTone(200, 0.08);
    setTimeout(() => playTone(300, 0.08), 100);
    setTimeout(() => playTone(250, 0.08), 200);
    setTimeout(() => playTone(400, 0.12), 300);
  }, [playTone]);

  const playChatSound = useCallback(() => {
    // Quick "blip" for message
    playTone(800, 0.05);
    setTimeout(() => playTone(1000, 0.08), 30);
  }, [playTone]);

  return {
    playSitSound,
    playWaveSound,
    playDanceSound,
    playChatSound,
  };
};
