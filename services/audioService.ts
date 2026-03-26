let audioCtx: AudioContext | null = null;
let bgmMasterGain: GainNode | null = null;
let bgmOscillators: OscillatorNode[] = [];
let bgmLfo: OscillatorNode | null = null;
let bgmLfoGain: GainNode | null = null;

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

export const stopMenuBgm = () => {
  try {
    if (!audioCtx || !bgmMasterGain) return;
    const now = audioCtx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(now);
    bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
    bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    setTimeout(() => {
      bgmOscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_) {}
      });
      bgmOscillators = [];

      if (bgmLfo) {
        try {
          bgmLfo.stop();
          bgmLfo.disconnect();
        } catch (_) {}
        bgmLfo = null;
      }

      if (bgmLfoGain) {
        bgmLfoGain.disconnect();
        bgmLfoGain = null;
      }

      if (bgmMasterGain) {
        bgmMasterGain.disconnect();
        bgmMasterGain = null;
      }
    }, 450);
  } catch (e) {
    console.error("Stop BGM failed", e);
  }
};

export const startMenuBgm = () => {
  try {
    initAudio();
    if (!audioCtx || bgmMasterGain) return;

    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    master.connect(audioCtx.destination);

    const baseFreqs = [220, 329.63, 440];
    const oscillators = baseFreqs.map((freq, index) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx!.currentTime);
      gain.gain.setValueAtTime(index === 0 ? 0.45 : 0.2, audioCtx!.currentTime);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      return osc;
    });

    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();

    master.gain.exponentialRampToValueAtTime(0.045, audioCtx.currentTime + 1.2);

    bgmMasterGain = master;
    bgmOscillators = oscillators;
    bgmLfo = lfo;
    bgmLfoGain = lfoGain;
  } catch (e) {
    console.error("Start BGM failed", e);
  }
};

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
