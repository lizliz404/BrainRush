import React, { useState, useEffect } from 'react';
import { GameState, Difficulty, AvatarConfig, GameTuning, NumberRangeMode, OperationFocus, PlayMode, SubjectMode } from './types';
import GameEngine from './components/GameEngine';
import { Play, RotateCcw, BrainCircuit, Trophy, Heart, Lock, ArrowLeft, Shirt, SlidersHorizontal, Languages } from 'lucide-react';
import { initAudio, startMenuBgm, stopMenuBgm } from './services/audioService';

type Language = 'en' | 'zh';

const TRANSLATIONS = {
  en: {
    title: 'Brain Rush',
    subtitle: 'Solve fast. Move faster.',
    difficulty: 'Difficulty',
    practiceTuning: 'Practice Tuning',
    tuningDescription: 'Pick what to practice.',
    tuneQuestions: 'Tune Questions',
    backToMenu: 'Back',
    operationFocus: 'Operation Focus',
    numberRange: 'Number Range',
    operationRandom: 'Random Mix',
    operationAddSub: 'Mostly + / -',
    operationMulDiv: 'Mostly × / ÷',
    rangeRandom: 'Random Range',
    rangeWithin10: 'Within 10',
    rangeWithin20: 'Within 20',
    rangeAbove50: '50 and above',
    allowRemainder: 'Allow Remainder',
    allowNegative: 'Allow Negative',
    toggleOn: 'On',
    toggleOff: 'Off',
    presets: 'Quick Presets',
    presetBalanced: 'Balanced',
    presetAdd20: 'Add/Sub 20',
    presetMulDiv: 'Mul/Div Drill',
    presetRemainder: 'Remainder',
    presetSigned: 'Signed Challenge',
    lives: 'Lives',
    timer: 'Timer',
    accuracy: 'Accuracy',
    quickStart: '60s Quick Start',
    quickModeNote: 'Low-threshold mode: fixed Normal settings + unlimited lives.',
    openAdvanced: 'Advanced',
    startGame: 'START GAME',
    customize: 'Customize Avatar',
    instruction: 'Use ← → arrows or Drag to move',
    gameOver: 'GAME OVER',
    missed: 'You missed the answer!',
    score: 'Score',
    best: 'Best',
    tryAgain: 'TRY AGAIN',
    mainMenu: 'Main Menu',
    lockerRoom: 'Locker Room',
    head: 'Head',
    body: 'Body',
    legs: 'Legs',
    movePrompt: 'Move to the Correct Answer',
    mathMode: 'Math Rush',
    wordMode: 'Word Speedrun',
    wordModeDescription: 'Word choice + simple sentence fill, two directions mixed.'
  },
  zh: {
    title: '头脑冲刺',
    subtitle: '算得快，躲得更快。',
    difficulty: '难度',
    practiceTuning: '练习调节',
    tuningDescription: '开始前先选这局练什么。',
    tuneQuestions: '调节题目',
    backToMenu: '返回',
    operationFocus: '题型倾向',
    numberRange: '数值范围',
    operationRandom: '随机混合',
    operationAddSub: '偏向加减',
    operationMulDiv: '偏向乘除',
    rangeRandom: '随机范围',
    rangeWithin10: '十以内',
    rangeWithin20: '二十以内',
    rangeAbove50: '五十以上',
    allowRemainder: '允许余数',
    allowNegative: '允许负数',
    toggleOn: '开启',
    toggleOff: '关闭',
    presets: '快捷模板',
    presetBalanced: '均衡模式',
    presetAdd20: '20内加减',
    presetMulDiv: '乘除专项',
    presetRemainder: '余数除法',
    presetSigned: '负数挑战',
    lives: '血量',
    timer: '倒计时',
    accuracy: '正确率',
    quickStart: '60 秒快速练习',
    quickModeNote: '低门槛模式：固定普通参数 + 无限命。',
    openAdvanced: '高级调节',
    startGame: '开始游戏',
    customize: '自定义外观',
    instruction: '使用 ← → 方向键或拖拽来移动',
    gameOver: '游戏结束',
    missed: '你错过了正确答案！',
    score: '得分',
    best: '最高分',
    tryAgain: '再试一次',
    mainMenu: '返回主菜单',
    lockerRoom: '更衣室',
    head: '头部',
    body: '上衣',
    legs: '下装',
    movePrompt: '移动到正确答案下方',
    mathMode: '数学冲刺',
    wordMode: '单词极速跑',
    wordModeDescription: '单词中英互选 + 句子填空，方向随机。'
  }
};

const DIFFICULTY_CONFIG: Record<Difficulty, { lives: number; label: { en: string; zh: string } }> = {
  [Difficulty.EASY]: { lives: 4, label: { en: 'EASY', zh: '简单' } },
  [Difficulty.NORMAL]: { lives: 3, label: { en: 'NORMAL', zh: '普通' } },
  [Difficulty.HARD]: { lives: 2, label: { en: 'HARD', zh: '困难' } },
  [Difficulty.DEVIL]: { lives: 1, label: { en: 'DEVIL', zh: '地狱' } },
};

const UNLOCKABLE_SETS = [
  { score: 0, head: '😃', body: '👕', legs: '👖' },
  { score: 10, head: '😎', body: '🧥', legs: '🩳' },
  { score: 20, head: '🤖', body: '🥋', legs: '🦿' },
  { score: 30, head: '👽', body: '🥼', legs: '👢' },
  { score: 40, head: '🤠', body: '👔', legs: '🩲' },
  { score: 50, head: '🎃', body: '👗', legs: '👠' },
];

const DEFAULT_TUNING: GameTuning = {
  operationFocus: OperationFocus.RANDOM,
  numberRange: NumberRangeMode.RANDOM,
  allowRemainder: false,
  allowNegative: false,
};

export default function App() {
  const [menuView, setMenuView] = useState<'main' | 'tuning'>('main');
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(DIFFICULTY_CONFIG[Difficulty.NORMAL].lives);
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.CLASSIC);
  const [subjectMode, setSubjectMode] = useState<SubjectMode>(SubjectMode.MATH);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [lang, setLang] = useState<Language>('en');
  
  const t = TRANSLATIONS[lang];

  // Load saved data
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('brainRushHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('brainRushAvatar');
    return saved ? JSON.parse(saved) : { head: '😃', body: '👕', legs: '👖' };
  });

  const [tuning, setTuning] = useState<GameTuning>(() => {
    const saved = localStorage.getItem('brainRushTuning');
    return saved ? { ...DEFAULT_TUNING, ...JSON.parse(saved) } : DEFAULT_TUNING;
  });

  // Save when changed
  useEffect(() => {
    localStorage.setItem('brainRushHighScore', highScore.toString());
  }, [highScore]);

  useEffect(() => {
    localStorage.setItem('brainRushAvatar', JSON.stringify(avatar));
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('brainRushTuning', JSON.stringify(tuning));
  }, [tuning]);

  const getOperationLabel = (focus: OperationFocus) => {
    switch (focus) {
      case OperationFocus.ADD_SUB:
        return t.operationAddSub;
      case OperationFocus.MUL_DIV:
        return t.operationMulDiv;
      case OperationFocus.RANDOM:
      default:
        return t.operationRandom;
    }
  };

  const getRangeLabel = (range: NumberRangeMode) => {
    switch (range) {
      case NumberRangeMode.WITHIN_10:
        return t.rangeWithin10;
      case NumberRangeMode.WITHIN_20:
        return t.rangeWithin20;
      case NumberRangeMode.ABOVE_50:
        return t.rangeAbove50;
      case NumberRangeMode.RANDOM:
      default:
        return t.rangeRandom;
    }
  };

  const getToggleLabel = (enabled: boolean) => (enabled ? t.toggleOn : t.toggleOff);
  const getLivesLabel = () => {
    if (playMode === PlayMode.QUICK_60) return '∞';
    if (lives <= 0) return '0';
    return '❤'.repeat(lives);
  };

  const presets = [
    {
      key: 'balanced',
      label: t.presetBalanced,
      value: DEFAULT_TUNING,
    },
    {
      key: 'add20',
      label: t.presetAdd20,
      value: {
        operationFocus: OperationFocus.ADD_SUB,
        numberRange: NumberRangeMode.WITHIN_20,
        allowRemainder: false,
        allowNegative: false,
      },
    },
    {
      key: 'muldiv',
      label: t.presetMulDiv,
      value: {
        operationFocus: OperationFocus.MUL_DIV,
        numberRange: NumberRangeMode.WITHIN_20,
        allowRemainder: false,
        allowNegative: false,
      },
    },
    {
      key: 'remainder',
      label: t.presetRemainder,
      value: {
        operationFocus: OperationFocus.MUL_DIV,
        numberRange: NumberRangeMode.WITHIN_20,
        allowRemainder: true,
        allowNegative: false,
      },
    },
    {
      key: 'signed',
      label: t.presetSigned,
      value: {
        operationFocus: OperationFocus.ADD_SUB,
        numberRange: NumberRangeMode.ABOVE_50,
        allowRemainder: false,
        allowNegative: true,
      },
    },
  ];

  const isPresetActive = (presetValue: GameTuning) =>
    presetValue.operationFocus === tuning.operationFocus &&
    presetValue.numberRange === tuning.numberRange &&
    presetValue.allowRemainder === tuning.allowRemainder &&
    presetValue.allowNegative === tuning.allowNegative;

  const startGame = () => {
    initAudio();
    stopMenuBgm();
    setPlayMode(PlayMode.CLASSIC);
    setScore(0);
    setLives(DIFFICULTY_CONFIG[difficulty].lives);
    setAttempts(0);
    setCorrect(0);
    setAccuracy(0);
    setTimeLeftSec(60);
    setMenuView('main');
    setGameState(GameState.PLAYING);
  };

  const startQuickPractice = () => {
    initAudio();
    stopMenuBgm();
    setPlayMode(PlayMode.QUICK_60);
    setDifficulty(Difficulty.NORMAL);
    setTuning(DEFAULT_TUNING);
    setScore(0);
    setLives(Number.MAX_SAFE_INTEGER);
    setAttempts(0);
    setCorrect(0);
    setAccuracy(0);
    setTimeLeftSec(60);
    setMenuView('main');
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    setHighScore(prev => finalScore > prev ? finalScore : prev);
  };

  useEffect(() => {
    let bgmTimer: number | null = null;

    if (gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
      bgmTimer = window.setTimeout(() => {
        startMenuBgm();
      }, 1000);
    } else {
      stopMenuBgm();
    }

    return () => {
      if (bgmTimer !== null) window.clearTimeout(bgmTimer);
    };
  }, [gameState]);

  const renderCustomizeMenu = () => {
    const renderPartSelector = (part: keyof AvatarConfig, label: string) => (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{label}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {UNLOCKABLE_SETS.map((set, idx) => {
            const isUnlocked = highScore >= set.score;
            const isSelected = avatar[part] === set[part];
            return (
              <button
                key={idx}
                disabled={!isUnlocked}
                onClick={() => setAvatar(prev => ({ ...prev, [part]: set[part] }))}
                className={`relative shrink-0 w-16 h-16 rounded-2xl text-3xl flex items-center justify-center transition-all snap-center
                  ${isSelected ? 'bg-game-accent border-2 border-white shadow-lg scale-110' : 'bg-white/10 border border-white/5 hover:bg-white/20'}
                  ${!isUnlocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {set[part]}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center flex-col">
                    <Lock size={16} className="text-white/80 mb-1" />
                    <span className="text-[10px] font-bold text-white/80">{set.score}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="absolute inset-0 z-40 flex flex-col bg-game-bg p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => setGameState(GameState.MENU)}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-black ml-4">{t.lockerRoom}</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto w-full">
          {/* Avatar Preview */}
          <div className="flex-1 bg-white/5 rounded-3xl p-8 flex flex-col items-center justify-center border border-white/10">
            <div className="text-center space-y-[-1rem] text-8xl drop-shadow-2xl mb-8">
              <div>{avatar.head}</div>
              <div>{avatar.body}</div>
              <div>{avatar.legs}</div>
            </div>
            <div className="bg-white/10 px-6 py-2 rounded-full text-sm font-bold text-slate-300">
              {t.best}: {highScore}
            </div>
          </div>

          {/* Selectors */}
          <div className="flex-1">
            {renderPartSelector('head', t.head)}
            {renderPartSelector('body', t.body)}
            {renderPartSelector('legs', t.legs)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-game-bg text-game-text font-sans selection:bg-none pt-[calc(env(safe-area-inset-top)+4px)] pb-[calc(env(safe-area-inset-bottom)+4px)]">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#1e1b4b] to-black opacity-80 z-0"></div>

      {/* Language Switcher */}
      {(gameState === GameState.MENU || gameState === GameState.GAME_OVER || gameState === GameState.CUSTOMIZE) && (
        <div className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md rounded-full p-1 flex items-center border border-white/10 shadow-lg">
          <button 
            onClick={() => setLang('en')} 
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang('zh')} 
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'zh' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}
          >
            中
          </button>
        </div>
      )}

      {/* Game Layer */}
      <div className="relative z-10 w-full h-full">
        <GameEngine 
          gameState={gameState}
          difficulty={difficulty}
          playMode={playMode}
          subjectMode={subjectMode}
          avatar={avatar}
          tuning={tuning}
          initialLives={DIFFICULTY_CONFIG[difficulty].lives}
          onScoreUpdate={setScore}
          onLivesUpdate={setLives}
          onStatsUpdate={({ correct: nextCorrect, attempts: nextAttempts, accuracy: nextAccuracy, timeLeftSec: nextTimeLeft }) => {
            setCorrect(nextCorrect);
            setAttempts(nextAttempts);
            setAccuracy(nextAccuracy);
            setTimeLeftSec(nextTimeLeft);
          }}
          onGameOver={handleGameOver}
          onQuestionUpdate={setCurrentQuestion}
        />
      </div>

      {/* UI Overlay - HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-0 left-0 w-full px-3 py-2 z-20 pointer-events-none">
          <div className="flex flex-col items-center gap-2">

            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg flex items-center gap-2">
                <Heart size={16} className="text-rose-400 fill-current" />
                <span className="text-sm md:text-base font-bold text-white">
                  {t.lives}: {getLivesLabel()}
                </span>
              </div>
            </div>

            {playMode === PlayMode.QUICK_60 && (
              <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                <span className="text-xs md:text-sm font-bold text-amber-200">
                  {t.timer}: {timeLeftSec}s
                </span>
              </div>
            )}

            {/* Question Card */}
            <div className="bg-white/95 text-game-bg px-8 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in slide-in-from-top-4 duration-300">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-center whitespace-nowrap">
                {currentQuestion}
              </h1>
            </div>
            
            <p className="text-white/40 text-[11px] md:text-xs font-semibold tracking-wide uppercase mt-0.5 animate-pulse">
               {t.movePrompt}
            </p>
          </div>
        </div>
      )}

      {gameState === GameState.CUSTOMIZE && renderCustomizeMenu()}

      {/* Main Menu */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl text-center max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {menuView === 'main' ? (
              <>
            <div className="absolute left-4 top-4 z-20">
              <div className="bg-black/50 border border-white/10 rounded-xl p-1 flex items-center gap-1 shadow-lg">
                <button
                  onClick={() => setSubjectMode(SubjectMode.MATH)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${subjectMode === SubjectMode.MATH ? 'bg-white text-game-bg' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  {lang === 'zh' ? '数学' : 'Math'}
                </button>
                <button
                  onClick={() => setSubjectMode(SubjectMode.WORD)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${subjectMode === SubjectMode.WORD ? 'bg-white text-game-bg' : 'text-slate-300 hover:bg-white/10'}`}
                >
                  <Languages size={12} />
                  {lang === 'zh' ? '单词' : 'Word'}
                </button>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-game-accent rounded-2xl shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)]">
                <BrainCircuit size={48} className="text-white md:w-16 md:h-16" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              {subjectMode === SubjectMode.WORD ? t.wordMode : t.title}
            </h1>
            <p className="text-slate-300 text-base md:text-lg mb-4 font-medium">
              {subjectMode === SubjectMode.WORD ? t.wordModeDescription : t.subtitle}
            </p>

            {/* Difficulty Selector */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.difficulty}</h3>
              <div className="flex bg-black/40 rounded-xl p-1 gap-1">
                {Object.values(Difficulty).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-300 ease-out ${
                      difficulty === diff 
                        ? 'bg-white/95 text-game-bg shadow-md scale-[1.02]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {DIFFICULTY_CONFIG[diff].label[lang]}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-4 gap-1 text-center text-xs text-slate-400 leading-6 tracking-wide">
                {Object.values(Difficulty).map(diff => (
                  <span key={`hint-${diff}`}>
                    {lang === 'zh'
                      ? `${DIFFICULTY_CONFIG[diff].lives} 条命`
                      : `${DIFFICULTY_CONFIG[diff].lives} ${DIFFICULTY_CONFIG[diff].lives > 1 ? 'lives' : 'life'}`}
                  </span>
                ))}
              </div>
            </div>

            {subjectMode === SubjectMode.MATH && (
              <div className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-white">{t.practiceTuning}</h3>
                  <button
                    onClick={() => setMenuView('tuning')}
                    className="shrink-0 rounded-xl bg-white/10 p-3 text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
                    aria-label={t.openAdvanced}
                  >
                    <SlidersHorizontal size={18} />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
                  <button
                    onClick={() => setMenuView('tuning')}
                    className="rounded-full bg-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/20 active:scale-95"
                  >
                    {t.operationFocus}: {getOperationLabel(tuning.operationFocus)}
                  </button>
                  <button
                    onClick={() => setMenuView('tuning')}
                    className="rounded-full bg-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/20 active:scale-95"
                  >
                    {t.numberRange}: {getRangeLabel(tuning.numberRange)}
                  </button>
                  <button
                    onClick={() => setTuning(prev => ({ ...prev, allowRemainder: !prev.allowRemainder }))}
                    className="rounded-full bg-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/20 active:scale-95"
                  >
                    {t.allowRemainder}: {getToggleLabel(tuning.allowRemainder)}
                  </button>
                  <button
                    onClick={() => setTuning(prev => ({ ...prev, allowNegative: !prev.allowNegative }))}
                    className="rounded-full bg-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/20 active:scale-95"
                  >
                    {t.allowNegative}: {getToggleLabel(tuning.allowNegative)}
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={startGame}
              className="group w-full relative overflow-hidden bg-game-player hover:bg-cyan-400 text-game-bg font-black text-lg md:text-xl py-4 md:py-5 rounded-2xl transition-all duration-200 shadow-[0_4px_0_0_#0e7490] hover:translate-y-1 hover:shadow-none active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 mb-4"
            >
              <Play className="fill-current w-5 h-5 md:w-6 md:h-6" />
              {t.startGame}
            </button>

            <button
              onClick={startQuickPractice}
              className="w-full bg-amber-300 hover:bg-amber-200 text-game-bg font-black text-base md:text-lg py-3 md:py-4 rounded-2xl transition-colors mb-2"
            >
              {t.quickStart}
            </button>
            <div className="mb-4"></div>

            <button 
              onClick={() => setGameState(GameState.CUSTOMIZE)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-black text-base md:text-lg py-3 md:py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_0_0_rgba(148,163,184,0.35)] hover:translate-y-1 hover:shadow-none active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
            >
              <Shirt size={18} />
              {t.customize}
            </button>
            
            <div className="mt-6 md:mt-8 text-xs md:text-sm text-slate-500">
              {lang === 'zh' ? (
                <>使用 <span className="font-bold text-slate-300">← →</span> 方向键或 <span className="font-bold text-slate-300">拖拽</span> 来移动</>
              ) : (
                <>Use <span className="font-bold text-slate-300">← →</span> arrows or <span className="font-bold text-slate-300">Drag</span> to move</>
              )}
            </div>
              </>
            ) : subjectMode === SubjectMode.MATH ? (
              <div className="text-left">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">{t.practiceTuning}</h2>
                    <p className="mt-1 text-sm text-slate-400">{t.tuningDescription}</p>
                  </div>
                  <button
                    onClick={() => setMenuView('main')}
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {t.backToMenu}
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.operationFocus}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: OperationFocus.RANDOM, label: t.operationRandom },
                      { value: OperationFocus.ADD_SUB, label: t.operationAddSub },
                      { value: OperationFocus.MUL_DIV, label: t.operationMulDiv },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setTuning(prev => ({ ...prev, operationFocus: option.value }))}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all duration-300 ease-out ${
                          tuning.operationFocus === option.value
                            ? 'border-cyan-300 bg-cyan-400/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.numberRange}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: NumberRangeMode.RANDOM, label: t.rangeRandom },
                      { value: NumberRangeMode.WITHIN_10, label: t.rangeWithin10 },
                      { value: NumberRangeMode.WITHIN_20, label: t.rangeWithin20 },
                      { value: NumberRangeMode.ABOVE_50, label: t.rangeAbove50 },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setTuning(prev => ({ ...prev, numberRange: option.value }))}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all duration-300 ease-out ${
                          tuning.numberRange === option.value
                            ? 'border-indigo-300 bg-indigo-400/20 text-white shadow-[0_0_0_1px_rgba(129,140,248,0.25)]'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.allowRemainder}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[false, true].map(option => (
                      <button
                        key={String(option)}
                        onClick={() => setTuning(prev => ({ ...prev, allowRemainder: option }))}
                        className={`rounded-2xl border px-4 py-3 text-center transition-all duration-300 ease-out ${
                          tuning.allowRemainder === option
                            ? 'border-emerald-300 bg-emerald-400/20 text-white shadow-[0_0_0_1px_rgba(52,211,153,0.25)]'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">{getToggleLabel(option)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.allowNegative}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[false, true].map(option => (
                      <button
                        key={String(option)}
                        onClick={() => setTuning(prev => ({ ...prev, allowNegative: option }))}
                        className={`rounded-2xl border px-4 py-3 text-center transition-all duration-300 ease-out ${
                          tuning.allowNegative === option
                            ? 'border-rose-300 bg-rose-400/20 text-white shadow-[0_0_0_1px_rgba(251,113,133,0.25)]'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">{getToggleLabel(option)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.presets}</h3>
                  <div className="flex flex-wrap gap-2">
                    {presets.map(preset => (
                      <button
                        key={preset.key}
                        onClick={() => setTuning(preset.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-bold transition-all duration-300 ease-out ${
                          isPresetActive(preset.value)
                            ? 'border-white bg-white text-game-bg shadow-md'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  <p>{t.operationFocus}: <span className="font-bold text-white">{getOperationLabel(tuning.operationFocus)}</span></p>
                  <p className="mt-2">{t.numberRange}: <span className="font-bold text-white">{getRangeLabel(tuning.numberRange)}</span></p>
                  <p className="mt-2">{t.allowRemainder}: <span className="font-bold text-white">{getToggleLabel(tuning.allowRemainder)}</span></p>
                  <p className="mt-2">{t.allowNegative}: <span className="font-bold text-white">{getToggleLabel(tuning.allowNegative)}</span></p>
                </div>
              </div>
            ) : (
              <div className="text-left rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-300 text-sm leading-relaxed">
                <h2 className="text-xl font-black text-white mb-2">{t.wordMode}</h2>
                <p>{t.wordModeDescription}</p>
                <p className="mt-2">{lang === 'zh' ? '当前版本会随机出现：英文选中文 / 中文选英文 / 句子填空。' : 'Current version randomizes: EN→ZH / ZH→EN / sentence cloze.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white text-game-bg p-6 md:p-8 rounded-3xl shadow-2xl text-center max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <h2 className="text-3xl md:text-4xl font-black text-game-wrong mb-2">{t.gameOver}</h2>
            <p className="text-slate-500 font-bold mb-6 text-sm md:text-base">
              {playMode === PlayMode.QUICK_60 ? `${t.timer} 60s` : t.missed}
            </p>
            
            <div className="bg-slate-100 rounded-2xl p-4 md:p-6 mb-8">
              {playMode === PlayMode.QUICK_60 ? (
                <div className="flex justify-around">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">{t.score}</span>
                    <span className="text-3xl md:text-4xl font-black text-game-bg">{score}</span>
                  </div>
                  <div className="w-px bg-slate-300"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">{t.accuracy}</span>
                    <span className="text-3xl md:text-4xl font-black text-emerald-600">{accuracy}%</span>
                  </div>
                  <div className="w-px bg-slate-300"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">Q</span>
                    <span className="text-3xl md:text-4xl font-black text-game-bg">{correct}/{attempts}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-around">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">{t.score}</span>
                    <span className="text-3xl md:text-4xl font-black text-game-bg">{score}</span>
                  </div>
                  <div className="w-px bg-slate-300"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Trophy size={12} /> {t.best}
                    </span>
                    <span className="text-3xl md:text-4xl font-black text-amber-500">{highScore}</span>
                  </div>
                </div>
              )}
              {playMode === PlayMode.QUICK_60 && (
                <div className="mt-4 text-xs font-semibold text-slate-500">
                  {t.quickModeNote}
                </div>
              )}
            </div>

            <button 
              onClick={playMode === PlayMode.QUICK_60 ? startQuickPractice : startGame}
              className="w-full bg-game-bg hover:bg-slate-800 text-white font-black text-lg md:text-xl py-4 md:py-5 rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg mb-4"
            >
              <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
              {t.tryAgain}
            </button>

            <button 
              onClick={() => setGameState(GameState.MENU)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-base md:text-lg py-3 md:py-4 rounded-2xl transition-colors"
            >
              {t.mainMenu}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
