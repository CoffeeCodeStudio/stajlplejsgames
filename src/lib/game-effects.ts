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

// ── Retro synth sounds via Web Audio API ──

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
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

let drawNoiseNode: AudioBufferSourceNode | null = null;
let drawGainNode: GainNode | null = null;

/** Short pen-down click */
export function playPenDownSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Audio not available
  }
}

/** Start a looping scratch/scribble noise while drawing */
export function startDrawNoise() {
  try {
    stopDrawNoise();
    const ctx = getAudioCtx();

    // Generate a short buffer of filtered noise (pencil scratch texture)
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 0.15; // 150ms loop
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Bandpass filter to sound like pencil-on-paper
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.07; // ~10-15% volume, very subtle

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();

    drawNoiseNode = source;
    drawGainNode = gain;
  } catch {
    // Audio not available
  }
}

/** Stop the drawing noise immediately */
export function stopDrawNoise() {
  try {
    if (drawNoiseNode) {
      drawNoiseNode.stop();
      drawNoiseNode.disconnect();
      drawNoiseNode = null;
    }
    if (drawGainNode) {
      drawGainNode.disconnect();
      drawGainNode = null;
    }
  } catch {
    // Already stopped
  }
}
