let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let bgmDelay: DelayNode | null = null;
let bgmDelayFeedback: GainNode | null = null;
let bgmDelayWetGain: GainNode | null = null;
let bgmOscillators: OscillatorNode[] = [];
let bgmTimer: number | null = null;
let bgmMode: 'menu' | 'game' | null = null;

type BgmMode = 'menu' | 'game';

const BGM_CONFIG = {
  menu: {
    volume: 0.032,
    wave: 'sine' as OscillatorType,
    notes: [261.63, 329.63, 392.0, 523.25],
    stepMs: 720,
    noteGain: 0.16,
    echoDelaySec: 0.46,
    echoFeedback: 0.18,
    echoWet: 0.2,
    detuneCents: 5,
  },
  game: {
    volume: 0.04,
    wave: 'triangle' as OscillatorType,
    notes: [392.0, 440.0, 523.25, 659.25],
    stepMs: 360,
    noteGain: 0.13,
    echoDelaySec: 0.24,
    echoFeedback: 0.14,
    echoWet: 0.14,
    detuneCents: 7,
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

const clearBgmTimer = () => {
  if (bgmTimer !== null) {
    window.clearTimeout(bgmTimer);
    bgmTimer = null;
  }
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

const disconnectBgmGraph = () => {
  [bgmDelay, bgmDelayFeedback, bgmDelayWetGain, bgmMasterGain].forEach(node => {
    try {
      node?.disconnect();
    } catch (_) {}
  });
  bgmDelay = null;
  bgmDelayFeedback = null;
  bgmDelayWetGain = null;
  bgmMasterGain = null;
};

export const stopBgm = () => {
  try {
    clearBgmTimer();
    bgmMode = null;
    const oscillatorsToStop = bgmOscillators;
    bgmOscillators = [];

    if (!audioCtx || !bgmMasterGain) {
      stopBgmOscillators(oscillatorsToStop);
      disconnectBgmGraph();
      return;
    }

    const now = audioCtx.currentTime;
    const gainToFade = bgmMasterGain;
    gainToFade.gain.cancelScheduledValues(now);
    gainToFade.gain.setValueAtTime(Math.max(gainToFade.gain.value, 0.0001), now);
    gainToFade.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    window.setTimeout(() => {
      stopBgmOscillators(oscillatorsToStop);
      disconnectBgmGraph();
    }, 320);
  } catch (e) {
    console.error('Stop BGM failed', e);
  }
};

const createBgmVoice = (frequency: number, detuneCents: number, mode: BgmMode, gainMultiplier = 1) => {
  if (!audioCtx || !bgmMasterGain || !bgmDelayWetGain) return;

  const config = BGM_CONFIG[mode];
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = config.wave;
  osc.frequency.setValueAtTime(frequency, now);
  osc.detune.setValueAtTime(detuneCents, now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(config.noteGain * gainMultiplier, now + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.stepMs / 1000 * 0.82);

  osc.connect(gainNode);
  gainNode.connect(bgmMasterGain);
  gainNode.connect(bgmDelayWetGain);
  osc.start(now);
  osc.stop(now + config.stepMs / 1000 * 0.9);
  bgmOscillators.push(osc);

  osc.onended = () => {
    bgmOscillators = bgmOscillators.filter(item => item !== osc);
    try {
      gainNode.disconnect();
    } catch (_) {}
  };
};

const playBgmNote = (mode: BgmMode, index: number) => {
  if (!audioCtx || !bgmMasterGain || bgmMode !== mode) return;

  const config = BGM_CONFIG[mode];
  const frequency = config.notes[index % config.notes.length];
  createBgmVoice(frequency, 0, mode, 1);
  createBgmVoice(frequency, config.detuneCents, mode, 0.42);

  bgmTimer = window.setTimeout(() => {
    bgmTimer = null;
    playBgmNote(mode, index + 1);
  }, config.stepMs);
};

const startBgm = (mode: BgmMode) => {
  try {
    initAudio();
    if (!audioCtx) return;
    if (bgmMode === mode) return;

    stopBgm();
    bgmMode = mode;

    const config = BGM_CONFIG[mode];
    bgmMasterGain = audioCtx.createGain();
    bgmDelay = audioCtx.createDelay(1);
    bgmDelayFeedback = audioCtx.createGain();
    bgmDelayWetGain = audioCtx.createGain();

    bgmMasterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    bgmMasterGain.gain.exponentialRampToValueAtTime(config.volume, audioCtx.currentTime + 0.28);
    bgmDelay.delayTime.setValueAtTime(config.echoDelaySec, audioCtx.currentTime);
    bgmDelayFeedback.gain.setValueAtTime(config.echoFeedback, audioCtx.currentTime);
    bgmDelayWetGain.gain.setValueAtTime(config.echoWet, audioCtx.currentTime);

    bgmDelayWetGain.connect(bgmDelay);
    bgmDelay.connect(bgmDelayFeedback);
    bgmDelayFeedback.connect(bgmDelay);
    bgmDelay.connect(bgmMasterGain);
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
