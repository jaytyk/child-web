/**
 * Web Speech API and Web Audio API synthesizer for toddler interaction.
 * Rate 0.8, Pitch 1.2, ko-KR.
 * Safe, gentle sounds without harsh buzzers.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function activateAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (err) {
    console.warn('AudioContext activation failed:', err);
  }
}

// Global speech settings
let currentSettings = {
  rate: 0.8,
  pitch: 1.2,
  volume: 1.0,
  sfxVolume: 1.0,
};

export function updateAudioSettings(settings: { rate?: number; pitch?: number; volume?: number; sfxVolume?: number }) {
  if (settings.rate !== undefined) currentSettings.rate = settings.rate;
  if (settings.pitch !== undefined) currentSettings.pitch = settings.pitch;
  if (settings.volume !== undefined) currentSettings.volume = settings.volume;
  if (settings.sfxVolume !== undefined) currentSettings.sfxVolume = settings.sfxVolume;
}

/**
 * Text to speech with Korean voice
 * Stops any ongoing speech before starting a new one.
 */
export function speak(text: string, onEnd?: () => void): void {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop prior speech immediately

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = currentSettings.rate;
    utterance.pitch = currentSettings.pitch;
    utterance.volume = currentSettings.volume;

    // Try finding best Korean voice
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find(v => v.lang.startsWith('ko') || v.lang.includes('KR'));
    if (koVoice) {
      utterance.voice = koVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('TTS error:', err);
    if (onEnd) onEnd();
  }
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export type SfxType = 'button' | 'correct' | 'sticker' | 'pop' | 'gentle' | 'munch' | 'success';

/**
 * Synthesizes sound effects purely with Web Audio API (no external MP3/WAV files)
 */
export function playSfx(type: SfxType): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = currentSettings.sfxVolume;

    if (type === 'button') {
      // "톡" - Crisp wooden woodblock tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.3 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } 
    else if (type === 'correct') {
      // "띠리링" / "뿅" - Bright ascending chime
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.25 * vol, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } 
    else if (type === 'sticker') {
      // "짠!" - Magical glitter sparkle
      const notes = [659.25, 880.00, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.2 * vol, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.5);
      });
    } 
    else if (type === 'pop') {
      // "팡!" - 3 random bubbly balloon pop variants
      const variant = Math.floor(Math.random() * 3);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (variant === 0) {
        // High bouncy pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
        gain.gain.setValueAtTime(0.4 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      } else if (variant === 1) {
        // Deep round pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.11);
        gain.gain.setValueAtTime(0.45 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      } else {
        // Crisp double pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.35 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } 
    else if (type === 'gentle') {
      // Gentle encouraging tone for "다시 해볼까?" (never harsh red buzzer!)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.linearRampToValueAtTime(390, now + 0.15);

      gain.gain.setValueAtTime(0.18 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } 
    else if (type === 'munch') {
      // Rabbit munching carrot
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.04);
      osc.frequency.setValueAtTime(450, now + 0.08);

      gain.gain.setValueAtTime(0.3 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
    else if (type === 'success') {
      // Fanfare at end of round
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.15 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      });
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}
