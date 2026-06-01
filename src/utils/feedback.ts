/**
 * Feedback system (audio chimes and vibration) for QR scanner feedback.
 * Works entirely offline and eliminates external audio resource loading errors.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Audio Context lock release in browsers
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;
    
    // Modern Crisp Barcode Scanner sound: High-pitched double chirp
    // First high note: A5 (880 Hz) - very short and crisp
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    
    gain1.gain.setValueAtTime(0.5, now); // Significantly louder (5x of original 0.1)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Second high note: D6 (1174.66 Hz) - slightly delayed, sharp confirmation beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.06);
    
    // Use gain 0.5 to make it loud and audible on low-speaker mobile phones
    gain2.gain.setValueAtTime(0.5, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.start(now + 0.06);
    osc2.stop(now + 0.22);
  } catch (e) {
    console.error("Failed to play success sound", e);
  }
}

export function playErrorSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;
    
    // Distinct louder error dual warning buzzer
    // First Buzz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.linearRampToValueAtTime(120, now + 0.15);
    
    gain1.gain.setValueAtTime(0.5, now); // Loud buzzer
    gain1.gain.linearRampToValueAtTime(0.01, now + 0.15);
    
    const filter1 = ctx.createBiquadFilter();
    filter1.type = "lowpass";
    filter1.frequency.setValueAtTime(450, now);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second Buzz
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(180, now + 0.18);
    osc2.frequency.linearRampToValueAtTime(120, now + 0.33);
    
    gain2.gain.setValueAtTime(0.5, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.01, now + 0.33);
    
    const filter2 = ctx.createBiquadFilter();
    filter2.type = "lowpass";
    filter2.frequency.setValueAtTime(450, now + 0.18);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.start(now + 0.18);
    osc2.stop(now + 0.33);
  } catch (e) {
    console.error("Failed to play error sound", e);
  }
}

export function triggerSuccessVibration() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate([80, 50, 80]);
    } catch (e) {
      console.warn("Vibration not supported or blocked by sandbox context", e);
    }
  }
}

export function triggerErrorVibration() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(350);
    } catch (e) {
      console.warn("Vibration not supported or blocked by sandbox context", e);
    }
  }
}
