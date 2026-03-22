import confetti from "canvas-confetti";

// ── Confetti ──

export function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#ff0000", "#00ff44", "#ffcc00", "#0066ff", "#ff69b4", "#9933ff"],
  });
  // Second burst for extra flair
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { y: 0.5 },
      colors: ["#ff0000", "#00ff44", "#ffcc00", "#0066ff"],
    });
  }, 300);
}

// ── Mute control ──

let _muted = localStorage.getItem('game-sfx-muted') === 'true';

export function isMuted(): boolean { return _muted; }

export function setMuted(muted: boolean) {
  _muted = muted;
  localStorage.setItem('game-sfx-muted', String(muted));
}

// ── Retro synth sounds via Web Audio API ──

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (_muted) throw new Error('muted');
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Short retro victory fanfare – ascending chiptune arpeggio */
export function playVictorySound() {
  try {
    const ctx = getAudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    const now = ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.25);
    });
  } catch {
    // Audio not available
  }
}

/** Short "correct" ding – two quick ascending notes */
export function playCorrectSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.15);
    });
  } catch {
    // Audio not available
  }
}

/** Retro game-over sound – descending chromatic buzz */
export function playGameOverSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const notes = [440, 370, 311, 233]; // A4 → F#4 → Eb4 → Bb3

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.14, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.2);
    });
  } catch {
    // Audio not available
  }
}

/** Short 8-bit "pling" for collecting an item (e.g. apple) */
export function playPickupSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Audio not available
  }
}

/** Subtle card-flip tick sound */
export function playFlipSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Audio not available
  }
}

/** Happy 8-bit match sound – two ascending beeps */
export function playMatchSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    [987.77, 1318.5].forEach((freq, i) => { // B5 → E6
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.12);
    });
  } catch {
    // Audio not available
  }
}

/** Tick sound – short click like a clock ticking */
export function playTickSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Audio not available
  }
}

/** Buzzer sound – harsh low buzz for time's up */
export function playBuzzerSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Second dissonant tone for "buzz" feel
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "square";
    osc2.frequency.value = 155;
    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.5);
  } catch {
    // Audio not available
  }
}

// ── Drawing SFX ──

let lastScribbleTime = 0;

/** Short pen-down click */
export function playPenDownSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.025);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Audio not available
  }
}

/** Play a single short scribble burst — call from pointermove throttled */
export function playScribbleBurst() {
  const now = performance.now();
  if (now - lastScribbleTime < 60) return; // max ~16 bursts/sec
  lastScribbleTime = now;

  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;

    // Short noise burst (20-40ms) shaped like a pen scratch
    const sampleRate = ctx.sampleRate;
    const duration = 0.02 + Math.random() * 0.02; // 20-40ms
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Brownian noise (smoother, more organic than white noise)
    let last = 0;
    for (let i = 0; i < length; i++) {
      last += (Math.random() * 2 - 1) * 0.15;
      last = Math.max(-1, Math.min(1, last));
      data[i] = last;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    // Pitch variation ±10%
    source.playbackRate.value = 0.9 + Math.random() * 0.2;

    // Bandpass to sound like felt-tip on paper
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2500 + Math.random() * 1500; // 2500-4000 Hz
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.03, t); // very subtle
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(t);
    source.stop(t + duration + 0.01);
  } catch {
    // Audio not available
  }
}

/** No-op stubs kept for API compat */
export function startDrawNoise() {}
export function stopDrawNoise() {}
