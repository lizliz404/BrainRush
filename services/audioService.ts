let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let bgmOscillators: OscillatorNode[] = [];
let bgmTimers: number[] = [];
let bgmMode: 'menu' | 'game' | null = null;

type BgmMode = 'menu' | 'game';

const BGM_CONFIG = {
  menu: {
    volume: 0.035,
    wave: 'sine' as OscillatorType,
    notes: [261.63, 329.63, 392.0, 523.25],
    stepMs: 720,
  },
  game: {
    volume: 0.045,
    wave: 'triangle' as OscillatorType,
    notes: [392.0, 440.0, 523.25, 659.25],
    stepMs: 360,
  },
} as const;

export const initAudio = () => {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const clearBgmTimers = () => {
  bgmTimers.forEach(timer => window.clearTimeout(timer));
  bgmTimers = [];
};

const stopBgmOscillators = (oscillators = bgmOscillators) => {
  oscillators.forEach(osc => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (_) {}
  });
  if (oscillators === bgmOscillators) {
    bgmOscillators = [];
  }
};

export const stopBgm = () => {
  try {
    clearBgmTimers();
    bgmMode = null;
    const oscillatorsToStop = bgmOscillators;
    bgmOscillators = [];

    if (!audioCtx || !bgmMasterGain) {
      stopBgmOscillators(oscillatorsToStop);
      return;
    }

    const now = audioCtx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(now);
    bgmMasterGain.gain.setValueAtTime(Math.max(bgmMasterGain.gain.value, 0.0001), now);
    bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    const gainToDisconnect = bgmMasterGain;
    window.setTimeout(() => {
      stopBgmOscillators(oscillatorsToStop);
      try {
        gainToDisconnect.disconnect();
      } catch (_) {}
      if (bgmMasterGain === gainToDisconnect) bgmMasterGain = null;
    }, 280);
  } catch (e) {
    console.error('Stop BGM failed', e);
  }
};

const playBgmNote = (mode: BgmMode, index: number) => {
  if (!audioCtx || !bgmMasterGain || bgmMode !== mode) return;

  const config = BGM_CONFIG[mode];
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = config.wave;
  osc.frequency.setValueAtTime(config.notes[index % config.notes.length], now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.stepMs / 1000 * 0.82);

  osc.connect(gainNode);
  gainNode.connect(bgmMasterGain);
  osc.start(now);
  osc.stop(now + config.stepMs / 1000 * 0.88);
  bgmOscillators.push(osc);

  osc.onended = () => {
    bgmOscillators = bgmOscillators.filter(item => item !== osc);
    try {
      gainNode.disconnect();
    } catch (_) {}
  };

  const timer = window.setTimeout(() => playBgmNote(mode, index + 1), config.stepMs);
  bgmTimers.push(timer);
};

const startBgm = (mode: BgmMode) => {
  try {
    initAudio();
    if (!audioCtx) return;
    if (bgmMode === mode) return;

    stopBgm();
    bgmMode = mode;

    bgmMasterGain = audioCtx.createGain();
    bgmMasterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    bgmMasterGain.gain.exponentialRampToValueAtTime(BGM_CONFIG[mode].volume, audioCtx.currentTime + 0.28);
    bgmMasterGain.connect(audioCtx.destination);

    playBgmNote(mode, 0);
  } catch (e) {
    console.error('Start BGM failed', e);
  }
};

export const startMenuBgm = () => startBgm('menu');
export const startGameBgm = () => startBgm('game');
export const stopMenuBgm = stopBgm;

export const playSuccessSound = () => {
  try {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playErrorSound = () => {
  try {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};
