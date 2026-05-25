// 消除 any 类型的扩展声明
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

// ==========================================
// 1. 常量化与配置分离 (配置不同维度的空间听感)
// ==========================================
export type BgmMode = 'menu' | 'game';
enum AudioState { IDLE, MENU, GAME, TRANSITIONING }

const BGM_CONFIG = {
  menu: {
    // 菜单：空间感更"近"、温暖、沉浸（正弦波、窄声像、短混响）
    volume: 0.065,
    wave: 'sine' as OscillatorType,
    notes: [261.63, 329.63, 392.0, 523.25], // C4, E4, G4, C5
    stepMs: 720,
    noteGain: 0.18,
    
    panSpread: 0.35,          // 窄声像展开
    haasDelayMs: [0, 18],     // 主声部 0ms，单影子声部延迟 18ms
    detuneCents: 4,           // 轻微失谐，温暖合唱感
    
    reverbDelays: [0.03, 0.05], // 较小的房间混响
    reverbDecay: 0.25,        // 混响衰减快
    reverbWet: 0.15,          // 较少的环境音染
  },
  game: {
    // 游戏：空间感更"宽"、高能、紧张（三角波、宽声像、长混响）
    volume: 0.08,
    wave: 'triangle' as OscillatorType,
    notes: [392.0, 440.0, 523.25, 659.25], // G4, A4, C5, E5
    stepMs: 360,
    noteGain: 0.14,
    
    panSpread: 0.7,           // 宽广的声像展开
    haasDelayMs: [0, 15, 32], // 主声部 0ms，左右双影子声部延迟 15ms/32ms
    detuneCents: 8,           // 较强失谐，声音更厚重
    
    reverbDelays: [0.03, 0.05, 0.07], // 较空旷的混响
    reverbDecay: 0.35,        // 混响衰减慢
    reverbWet: 0.25,          // 更多的环境音染
  },
} as const;

// ==========================================
// 2. 类封装与生命周期管理
// ==========================================
class AudioManager {
  private ctx: AudioContext | null = null;
  private state: AudioState = AudioState.IDLE;
  
  // 活跃状态的节点引用（用于彻底销毁）
  private activeMasterGain: GainNode | null = null;
  private activeReverbInput: GainNode | null = null;
  private timerId: number | null = null;
  private activeOscillators: Set<OscillatorNode> = new Set();
  private graphNodesToDispose: Set<AudioNode> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // 监听页面卸载，防止内存泄漏
      window.addEventListener('beforeunload', () => this.dispose());
    }
  }

  public init() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('AudioContext initialization failed (silent fallback):', e);
    }
  }

  // 统一释放所有资源
  public dispose() {
    this.stopBgm(true);
    this.activeOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (_) {}
    });
    this.activeOscillators.clear();
    
    this.graphNodesToDispose.forEach(node => {
      try { node.disconnect(); } catch (_) {}
    });
    this.graphNodesToDispose.clear();

    if (this.ctx && this.ctx.state !== 'closed') {
      try { this.ctx.close(); } catch (_) {}
    }
    this.ctx = null;
  }

  // 跨浏览器兼容的立体声像节点
  private createPanner(panValue: number): AudioNode {
    if (!this.ctx) throw new Error('No AudioContext');
    
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = panValue;
      return panner;
    } else {
      // 老版本 Safari 的 fallback
      const panner = this.ctx.createPanner();
      panner.panningModel = 'equalpower';
      panner.setPosition(panValue, 0, 1 - Math.abs(panValue));
      return panner;
    }
  }

  // 构建并行混响槽 (Reverb Bus)
  private buildReverbBus(config: typeof BGM_CONFIG[BgmMode], dest: AudioNode): GainNode | null {
    if (!this.ctx) return null;

    const reverbInput = this.ctx.createGain();
    const reverbWetGain = this.ctx.createGain();
    
    reverbInput.gain.value = 1;
    reverbWetGain.gain.value = config.reverbWet;
    reverbWetGain.connect(dest);

    // 并联多个不同延迟时间的 DelayNode 模拟房间反射
    config.reverbDelays.forEach(delayTimeSec => {
      const delayNode = this.ctx!.createDelay(1);
      const feedbackNode = this.ctx!.createGain();
      
      delayNode.delayTime.value = delayTimeSec;
      feedbackNode.gain.value = config.reverbDecay;

      reverbInput.connect(delayNode);
      delayNode.connect(feedbackNode);
      feedbackNode.connect(delayNode);
      delayNode.connect(reverbWetGain);

      this.graphNodesToDispose.add(delayNode).add(feedbackNode);
    });

    this.graphNodesToDispose.add(reverbInput).add(reverbWetGain);
    return reverbInput;
  }

  // ==========================================
  // 3. 核心 BGM 逻辑：Haas效应与声像处理
  // ==========================================
  private createVoice(
    freq: number, 
    mode: BgmMode, 
    delayMs: number, 
    pan: number, 
    gainMultiplier: number
  ) {
    if (!this.ctx || !this.activeMasterGain) return;

    const config = BGM_CONFIG[mode];
    const now = this.ctx.currentTime;
    // 核心：使用调度时间实现 Haas Effect 延迟，极其精准且无额外节点开销
    const startTime = now + delayMs / 1000; 

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const pannerNode = this.createPanner(pan);

    osc.type = config.wave;
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Chorus: 针对影子声部做随机失谐，防止出现相位抵消 (Phasing)
    const randomDetune = (Math.random() - 0.5) * 2 * config.detuneCents;
    osc.detune.setValueAtTime(randomDetune, startTime);

    // 声音包络 (ADSR)
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(config.noteGain * gainMultiplier, startTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + config.stepMs / 1000 * 0.82);

    // 节点连接: Osc -> Gain -> Panner -> (Master & Reverb)
    osc.connect(gainNode);
    gainNode.connect(pannerNode);
    
    pannerNode.connect(this.activeMasterGain);
    if (this.activeReverbInput) {
      pannerNode.connect(this.activeReverbInput);
    }

    osc.start(startTime);
    osc.stop(startTime + config.stepMs / 1000 * 0.9);
    
    this.activeOscillators.add(osc);
    this.graphNodesToDispose.add(gainNode).add(pannerNode);

    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gainNode.disconnect();
        pannerNode.disconnect();
        this.graphNodesToDispose.delete(gainNode);
        this.graphNodesToDispose.delete(pannerNode);
      } catch (_) {}
    };
  }

  private playBgmNote(mode: BgmMode, index: number) {
    if (!this.ctx || !this.activeMasterGain) return;
    if (this.state !== AudioState.MENU && this.state !== AudioState.GAME) return;

    const config = BGM_CONFIG[mode];
    const freq = config.notes[index % config.notes.length];

    // 1. 主声部 (居中或极其轻微随机声像，无延迟)
    const centerPan = (Math.random() * 0.1 - 0.05); 
    this.createVoice(freq, mode, config.haasDelayMs[0], centerPan, 1);

    // 2. 影子声部1 (左侧，存在微小延迟)
    if (config.haasDelayMs.length > 1) {
      this.createVoice(freq, mode, config.haasDelayMs[1], -config.panSpread, 0.6);
    }

    // 3. 影子声部2 (右侧，延迟更长，通常用于 Game 模式增加厚度)
    if (config.haasDelayMs.length > 2) {
      this.createVoice(freq, mode, config.haasDelayMs[2], config.panSpread, 0.6);
    }

    // 循环调度下一个音符
    this.timerId = window.setTimeout(() => {
      this.timerId = null;
      this.playBgmNote(mode, index + 1);
    }, config.stepMs);
  }

  public startBgm(mode: BgmMode) {
    try {
      this.init();
      if (!this.ctx) return;
      const targetState = mode === 'menu' ? AudioState.MENU : AudioState.GAME;
      if (this.state === targetState) return;

      this.stopBgm(); // 平滑淡出旧 BGM
      this.state = targetState;

      const config = BGM_CONFIG[mode];
      
      // 创建【独立全新的】局部混音图，避免淡出时的状态冲突爆音
      const masterGain = this.ctx.createGain();
      const reverbInput = this.buildReverbBus(config, masterGain);

      masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(config.volume, this.ctx.currentTime + 0.28);
      masterGain.connect(this.ctx.destination);

      // 绑定到实例以便追踪管理
      this.activeMasterGain = masterGain;
      this.activeReverbInput = reverbInput;
      this.graphNodesToDispose.add(masterGain);

      this.playBgmNote(mode, 0);
    } catch (e) {
      console.warn('Start BGM failed (silent fallback):', e);
    }
  }

  public stopBgm(immediate = false) {
    try {
      if (this.timerId !== null) {
        window.clearTimeout(this.timerId);
        this.timerId = null;
      }
      this.state = AudioState.IDLE;

      // 捕获当前的局部节点（使用闭包防止在新 BGM start 时被误杀）
      const gainToFade = this.activeMasterGain;
      const oscToStop = Array.from(this.activeOscillators);
      
      // 断开类实例引用，为新的 BGM 腾出空间
      this.activeMasterGain = null;
      this.activeReverbInput = null;
      oscToStop.forEach(osc => this.activeOscillators.delete(osc));

      if (!this.ctx || !gainToFade) {
        oscToStop.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch (_) {} });
        return;
      }

      const now = this.ctx.currentTime;
      if (immediate) {
        gainToFade.gain.setValueAtTime(0, now);
      } else {
        // 平滑 Fade-out
        gainToFade.gain.cancelScheduledValues(now);
        gainToFade.gain.setValueAtTime(Math.max(gainToFade.gain.value, 0.0001), now);
        gainToFade.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      }

      // 定时彻底断开被隔离的旧节点
      window.setTimeout(() => {
        oscToStop.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch (_) {} });
        try { gainToFade.disconnect(); } catch (_) {}
        this.graphNodesToDispose.delete(gainToFade);
      }, immediate ? 0 : 320);

    } catch (e) {
      console.warn('Stop BGM failed (silent fallback):', e);
    }
  }

  // ==========================================
  // 4. 短促音效
  // ==========================================
  public playSuccessSound() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const dur = 0.28;
      // 三音阶跃琶音：C5 → E5 → G5，每次跳变而非滑音
      const notes = [
        { freq: 523.25, time: 0 },       // C5
        { freq: 659.25, time: 0.07 },    // E5
        { freq: 783.99, time: 0.14 },    // G5
      ];

      notes.forEach(({ freq, time }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);
        // 轻微失谐让音色更温暖
        osc.detune.setValueAtTime(3, now + time);

        const t0 = now + time;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.14, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur - time);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t0);
        osc.stop(t0 + dur - time);

        osc.onended = () => {
          try { osc.disconnect(); gain.disconnect(); } catch (_) {}
        };
      });
    } catch (e) {
      console.warn('Success sound failed (silent fallback):', e);
    }
  }

  public playErrorSound() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const dur = 0.32;

      // 主嗡声：sawtooth 两段式下降
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.setValueAtTime(75, now + 0.08);   // 快速掉到低沉区
      osc.frequency.exponentialRampToValueAtTime(35, now + dur); // 继续下滑

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.015); // 快速冲击
      gain.gain.setValueAtTime(0.14, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur);

      // 底噪层：短促白噪增加质感
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = this.ctx.createBufferSource();
      const noiseGain = this.ctx.createGain();
      const noiseFilter = this.ctx.createBiquadFilter();

      noise.buffer = noiseBuffer;
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);

      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.01);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.1);

      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (_) {}
      };
      noise.onended = () => {
        try { noise.disconnect(); noiseFilter.disconnect(); noiseGain.disconnect(); } catch (_) {}
      };
    } catch (e) {
      console.warn('Error sound failed (silent fallback):', e);
    }
  }
}

// ==========================================
// 5. 保持现有 API 导出签名完全向后兼容
// ==========================================
const audioManager = new AudioManager();

export const initAudio = () => audioManager.init();
export const startMenuBgm = () => audioManager.startBgm('menu');
export const startGameBgm = () => audioManager.startBgm('game');
export const stopBgm = () => audioManager.stopBgm();
export const stopMenuBgm = () => audioManager.stopBgm();
export const playSuccessSound = () => audioManager.playSuccessSound();
export const playErrorSound = () => audioManager.playErrorSound();
