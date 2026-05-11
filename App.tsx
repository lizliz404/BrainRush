import React, { useState, useEffect, useRef } from 'react';
import { AvatarConfig, Difficulty, GameState, GameTuning, MistakeRecord, NumberRangeMode, OperationFocus, PlayMode, SubjectMode, TimedRunRecord, WordDirectionMode, WordTuning } from './types';
import GameEngine from './components/GameEngine';
import { Play, RotateCcw, BrainCircuit, Trophy, Heart, Lock, ArrowLeft, Shirt, SlidersHorizontal, Languages, MessageCircle } from 'lucide-react';
import { initAudio, startMenuBgm, stopMenuBgm } from './services/audioService';

type Language = 'en' | 'zh';

const TRANSLATIONS = {
  en: {
    title: 'Brain Rush',
    subtitle: 'Solve fast. Move faster.',
    difficulty: 'Difficulty',
    practiceTuning: 'Practice Tuning',
    wordPracticeTuning: 'Word Tuning',
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
    allowCloze: 'Sentence Cloze',
    wordDirection: 'Direction',
    directionMixed: 'Mixed',
    directionEnToZh: 'EN -> ZH',
    directionZhToEn: 'ZH -> EN',
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
    quickStart: '60s Timed Mode',
    quickModeNote: 'Timed mode for the current subject: Normal questions + unlimited lives + Hard-speed drops.',
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
    wordModeDescription: 'Word choice + simple sentence fill, two directions mixed.',
    localTimedBoard: 'Local Timed Board',
    recentMistakes: 'Wrong Answer Book',
    noMistakes: 'No mistakes saved yet.',
    yourAnswer: 'Your answer',
    correctAnswer: 'Correct answer',
    missedAnswer: 'Missed',
    timedBoardEmpty: 'No 60s runs saved yet.',
    boundaryTitle: 'What this game does',
    boundaryItems: ['Local data only', '60-second practice'],
    productNote: 'Scores, avatar, tuning, mistakes, and timed runs stay in this browser.',
    feedback: 'Feedback',
    feedbackTitle: 'Suggest a fix',
    feedbackHint: 'Tell me what felt wrong. This stays on this page first, so you do not need a GitHub account.',
    feedbackPlaceholder: 'Example: a question is too hard; mobile controls feel awkward; word mode needs…',
    feedbackSubmit: 'Submit feedback',
    feedbackSubmitting: 'Submitting…',
    feedbackSubmitted: 'Received. Thank you.',
    feedbackError: 'Submit failed. You can still send it to Liz directly.',
    feedbackContact: 'You can also scan WeChat and send Liz a screenshot plus one sentence.',
    feedbackGithub: 'Advanced: GitHub Issues',
    feedbackTabForm: 'Submit here',
    feedbackWechat: 'WeChat',
    feedbackWechatHint: 'Scan WeChat for screenshots, screen recordings, or short feedback.',
    feedbackWechatQrAlt: "Liz's WeChat QR code",
    feedbackWechatMissing: 'WeChat QR image should be placed at public/wechat-qr.png',
    feedbackClose: 'Close',
    exportData: 'Export my data',
    clearData: 'Clear local data',
    clearDataConfirm: 'Clear local Brain Rush data in this browser?',
    firstRunHint: 'Default: Math + Normal. Use Quick Mode for a low-pressure 60s run, or Advanced if you want to tune the questions.',
    dataExported: 'Brain Rush data exported.',
    dataCleared: 'Local Brain Rush data cleared.',
  },
  zh: {
    title: '头脑冲刺',
    subtitle: '算得快，躲得更快。',
    difficulty: '难度',
    practiceTuning: '练习调节',
    wordPracticeTuning: '单词调节',
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
    allowCloze: '句子填空',
    wordDirection: '方向',
    directionMixed: '双向混合',
    directionEnToZh: '英译中',
    directionZhToEn: '中译英',
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
    quickStart: '60 秒计时模式',
    quickModeNote: '当前学科的计时模式：普通题目 + 无限命 + 困难档下落速度。',
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
    wordModeDescription: '单词中英互选 + 句子填空，方向随机。',
    localTimedBoard: '本地 60 秒榜',
    recentMistakes: '错题本',
    noMistakes: '还没有保存的错题。',
    yourAnswer: '你的答案',
    correctAnswer: '正确答案',
    missedAnswer: '漏题',
    timedBoardEmpty: '还没有保存的 60 秒成绩。',
    boundaryTitle: '这个游戏做什么',
    boundaryItems: ['数据只在本机', '60 秒练习'],
    productNote: '分数、外观、设置、错题和计时记录只保存在当前浏览器。',
    feedback: '反馈',
    feedbackTitle: '提建议 / 报错',
    feedbackHint: '直接写你觉得哪里不对。这里不会把你扔去 GitHub，也不需要账号。',
    feedbackPlaceholder: '例如：某道题太难；手机操作不顺；单词模式希望增加……',
    feedbackSubmit: '提交反馈',
    feedbackSubmitting: '提交中…',
    feedbackSubmitted: '已收到，感谢。',
    feedbackError: '提交失败。你也可以把内容发给 Liz。',
    feedbackContact: '也可以扫码加微信，把问题截图和一句话说明直接发给 Liz。',
    feedbackGithub: '高级入口：GitHub Issues',
    feedbackTabForm: '站内提交',
    feedbackWechat: '微信',
    feedbackWechatHint: '扫码加微信，适合发截图、录屏或一句话反馈。',
    feedbackWechatQrAlt: 'Liz 的微信二维码',
    feedbackWechatMissing: '微信二维码图片待放入 public/wechat-qr.png',
    feedbackClose: '关闭',
    exportData: '导出我的数据',
    clearData: '清除本机数据',
    clearDataConfirm: '清除这个浏览器里的 Brain Rush 本地数据？',
    firstRunHint: '默认：数学 + 普通难度。想低压力试一下，用 60 秒模式；想调题目，再进高级调节。',
    dataExported: 'Brain Rush 数据已导出。',
    dataCleared: '本地 Brain Rush 数据已清除。',
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

const DEFAULT_WORD_TUNING: WordTuning = {
  allowCloze: true,
  directionMode: WordDirectionMode.MIXED,
};

const HIGH_SCORE_STORAGE_KEYS: Record<SubjectMode, string> = {
  [SubjectMode.MATH]: 'brainRushHighScore_MATH',
  [SubjectMode.WORD]: 'brainRushHighScore_WORD',
};

const MISTAKE_STORAGE_KEYS: Record<SubjectMode, string> = {
  [SubjectMode.MATH]: 'brainRushMistakes_MATH',
  [SubjectMode.WORD]: 'brainRushMistakes_WORD',
};

const TIMED_RUN_STORAGE_KEYS: Record<SubjectMode, string> = {
  [SubjectMode.MATH]: 'brainRushTimedRuns_MATH',
  [SubjectMode.WORD]: 'brainRushTimedRuns_WORD',
};

const LEGACY_HIGH_SCORE_KEY = 'brainRushHighScore';
const WORD_TUNING_STORAGE_KEY = 'brainRushWordTuning';
const LOCAL_DATA_KEYS = [
  ...Object.values(HIGH_SCORE_STORAGE_KEYS),
  ...Object.values(MISTAKE_STORAGE_KEYS),
  ...Object.values(TIMED_RUN_STORAGE_KEYS),
  LEGACY_HIGH_SCORE_KEY,
  WORD_TUNING_STORAGE_KEY,
  'brainRushAvatar',
  'brainRushTuning',
];

const readStoredScore = (key: string): number | null => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const loadHighScores = (): Record<SubjectMode, number> => {
  const legacyHighScore = readStoredScore(LEGACY_HIGH_SCORE_KEY) ?? 0;

  return {
    [SubjectMode.MATH]: readStoredScore(HIGH_SCORE_STORAGE_KEYS[SubjectMode.MATH]) ?? legacyHighScore,
    [SubjectMode.WORD]: readStoredScore(HIGH_SCORE_STORAGE_KEYS[SubjectMode.WORD]) ?? 0,
  };
};

const loadStoredJson = <T extends object,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const loadStoredList = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadRecordsBySubject = <T,>(keys: Record<SubjectMode, string>): Record<SubjectMode, T[]> => ({
  [SubjectMode.MATH]: loadStoredList<T>(keys[SubjectMode.MATH]),
  [SubjectMode.WORD]: loadStoredList<T>(keys[SubjectMode.WORD]),
});

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [feedbackView, setFeedbackView] = useState<'form' | 'wechat'>('form');
  const [wechatQrReady, setWechatQrReady] = useState(true);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh'
      ? 'Brain Rush｜60 秒数学与单词反应练习'
      : 'Brain Rush｜60-second math and word reaction practice';
  }, [lang]);

  // Load saved data
  const [highScores, setHighScores] = useState<Record<SubjectMode, number>>(() => loadHighScores());
  
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('brainRushAvatar');
    return saved ? JSON.parse(saved) : { head: '😃', body: '👕', legs: '👖' };
  });

  const [tuning, setTuning] = useState<GameTuning>(() => {
    const saved = localStorage.getItem('brainRushTuning');
    return saved ? { ...DEFAULT_TUNING, ...JSON.parse(saved) } : DEFAULT_TUNING;
  });
  const [wordTuning, setWordTuning] = useState<WordTuning>(() => loadStoredJson(WORD_TUNING_STORAGE_KEY, DEFAULT_WORD_TUNING));
  const [mistakeBook, setMistakeBook] = useState<Record<SubjectMode, MistakeRecord[]>>(() => loadRecordsBySubject<MistakeRecord>(MISTAKE_STORAGE_KEYS));
  const [timedRunHistory, setTimedRunHistory] = useState<Record<SubjectMode, TimedRunRecord[]>>(() => loadRecordsBySubject<TimedRunRecord>(TIMED_RUN_STORAGE_KEYS));
  const [sessionMistakes, setSessionMistakes] = useState<MistakeRecord[]>([]);
  const sessionMistakesRef = useRef<MistakeRecord[]>([]);
  const latestStatsRef = useRef({ correct: 0, attempts: 0, accuracy: 0 });

  const currentHighScore = highScores[subjectMode];
  const overallHighScore = Math.max(...Object.values(highScores));
  const currentMistakes = mistakeBook[subjectMode];
  const currentTimedRuns = timedRunHistory[subjectMode];

  // Save when changed
  useEffect(() => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEYS[SubjectMode.MATH], highScores[SubjectMode.MATH].toString());
    localStorage.setItem(HIGH_SCORE_STORAGE_KEYS[SubjectMode.WORD], highScores[SubjectMode.WORD].toString());
  }, [highScores]);

  useEffect(() => {
    localStorage.setItem('brainRushAvatar', JSON.stringify(avatar));
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('brainRushTuning', JSON.stringify(tuning));
  }, [tuning]);

  useEffect(() => {
    localStorage.setItem(WORD_TUNING_STORAGE_KEY, JSON.stringify(wordTuning));
  }, [wordTuning]);

  useEffect(() => {
    localStorage.setItem(MISTAKE_STORAGE_KEYS[SubjectMode.MATH], JSON.stringify(mistakeBook[SubjectMode.MATH]));
    localStorage.setItem(MISTAKE_STORAGE_KEYS[SubjectMode.WORD], JSON.stringify(mistakeBook[SubjectMode.WORD]));
  }, [mistakeBook]);

  useEffect(() => {
    localStorage.setItem(TIMED_RUN_STORAGE_KEYS[SubjectMode.MATH], JSON.stringify(timedRunHistory[SubjectMode.MATH]));
    localStorage.setItem(TIMED_RUN_STORAGE_KEYS[SubjectMode.WORD], JSON.stringify(timedRunHistory[SubjectMode.WORD]));
  }, [timedRunHistory]);

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
  const getWordDirectionLabel = (direction: WordDirectionMode) => {
    switch (direction) {
      case WordDirectionMode.EN_TO_ZH:
        return t.directionEnToZh;
      case WordDirectionMode.ZH_TO_EN:
        return t.directionZhToEn;
      case WordDirectionMode.MIXED:
      default:
        return t.directionMixed;
    }
  };

  const getQuestionTextClass = () => {
    const length = currentQuestion.length;
    if (subjectMode === SubjectMode.WORD && length > 36) return 'text-xl md:text-3xl leading-snug';
    if (subjectMode === SubjectMode.WORD && length > 18) return 'text-2xl md:text-4xl leading-tight';
    if (length > 20) return 'text-3xl md:text-4xl leading-tight';
    return 'text-4xl md:text-5xl leading-none';
  };

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

  const resetSessionMistakes = () => {
    sessionMistakesRef.current = [];
    setSessionMistakes([]);
  };

  const handleQuestionMistake = (mistake: MistakeRecord) => {
    const nextMistakes = [...sessionMistakesRef.current, mistake];
    sessionMistakesRef.current = nextMistakes;
    setSessionMistakes(nextMistakes);
  };

  const startGame = () => {
    initAudio();
    stopMenuBgm();
    setPlayMode(PlayMode.CLASSIC);
    setScore(0);
    setLives(DIFFICULTY_CONFIG[difficulty].lives);
    setAttempts(0);
    setCorrect(0);
    setAccuracy(0);
    latestStatsRef.current = { correct: 0, attempts: 0, accuracy: 0 };
    setTimeLeftSec(60);
    setMenuView('main');
    resetSessionMistakes();
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
    latestStatsRef.current = { correct: 0, attempts: 0, accuracy: 0 };
    setTimeLeftSec(60);
    setMenuView('main');
    resetSessionMistakes();
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    setHighScores(prev => ({
      ...prev,
      [subjectMode]: finalScore > prev[subjectMode] ? finalScore : prev[subjectMode],
    }));

    if (sessionMistakesRef.current.length > 0) {
      setMistakeBook(prev => ({
        ...prev,
        [subjectMode]: [...sessionMistakesRef.current, ...prev[subjectMode]].slice(0, 30),
      }));
    }

    if (playMode === PlayMode.QUICK_60) {
      const latestStats = latestStatsRef.current;
      const run: TimedRunRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        subjectMode,
        score: finalScore,
        accuracy: latestStats.accuracy,
        correct: latestStats.correct,
        attempts: latestStats.attempts,
        timestamp: new Date().toISOString(),
      };

      setTimedRunHistory(prev => ({
        ...prev,
        [subjectMode]: [...prev[subjectMode], run]
          .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || b.timestamp.localeCompare(a.timestamp))
          .slice(0, 8),
      }));
    }
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
            const isUnlocked = overallHighScore >= set.score;
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
              {t.best}: {overallHighScore}
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

  const renderMistakeList = (mistakes: MistakeRecord[]) => (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
      <h3 className="text-sm font-bold text-white">{t.recentMistakes}</h3>
      {mistakes.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{t.noMistakes}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {mistakes.slice(0, 5).map(mistake => (
            <div key={mistake.id} className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">
              <div className="font-bold text-white break-words">{mistake.questionText}</div>
              <div className="mt-2">
                {t.yourAnswer}: <span className="font-semibold text-amber-200 break-all">{mistake.selectedAnswer ?? t.missedAnswer}</span>
              </div>
              <div className="mt-1">
                {t.correctAnswer}: <span className="font-semibold text-emerald-300 break-all">{mistake.correctAnswer}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTimedBoard = () => (
    <div className="rounded-2xl border border-white/10 bg-slate-100 p-4 md:p-6 mt-4 text-left">
      <h3 className="text-sm font-bold text-game-bg">{t.localTimedBoard}</h3>
      {currentTimedRuns.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t.timedBoardEmpty}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {currentTimedRuns.slice(0, 5).map((run, index) => (
            <div key={run.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
              <div className="font-bold text-slate-500">#{index + 1}</div>
              <div className="text-game-bg font-black">{run.score}</div>
              <div className="text-emerald-600 font-semibold">{run.accuracy}%</div>
              <div className="text-slate-500">{run.correct}/{run.attempts}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  const exportLocalData = () => {
    const data = LOCAL_DATA_KEYS.reduce<Record<string, string | null>>((acc, key) => {
      acc[key] = localStorage.getItem(key);
      return acc;
    }, {});

    const blob = new Blob([
      JSON.stringify({ app: 'Brain Rush', exportedAt: new Date().toISOString(), data }, null, 2),
    ], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brain-rush-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    window.alert(t.dataExported);
  };

  const submitFeedback = async () => {
    const message = feedbackText.trim();
    if (!message) return;

    setFeedbackStatus('submitting');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'brain-rush',
          message,
          locale: lang,
          gameState,
          subjectMode,
          playMode,
          difficulty,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error(`Feedback request failed: ${response.status}`);
      }

      setFeedbackStatus('submitted');
      setFeedbackText('');
    } catch {
      setFeedbackStatus('error');
    }
  };

  const clearLocalData = () => {
    if (!window.confirm(t.clearDataConfirm)) return;

    LOCAL_DATA_KEYS.forEach(key => localStorage.removeItem(key));
    setHighScores({ [SubjectMode.MATH]: 0, [SubjectMode.WORD]: 0 });
    setAvatar({ head: '😃', body: '👕', legs: '👖' });
    setTuning(DEFAULT_TUNING);
    setWordTuning(DEFAULT_WORD_TUNING);
    setMistakeBook({ [SubjectMode.MATH]: [], [SubjectMode.WORD]: [] });
    setTimedRunHistory({ [SubjectMode.MATH]: [], [SubjectMode.WORD]: [] });
    resetSessionMistakes();
    window.alert(t.dataCleared);
  };


  return (
    <div className="relative w-full h-screen overflow-hidden bg-game-bg text-game-text font-sans selection:bg-none pt-[calc(env(safe-area-inset-top)+4px)] pb-[calc(env(safe-area-inset-bottom)+4px)]">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#1e1b4b] to-black opacity-80 z-0"></div>

      {/* Top Actions */}
      {(gameState === GameState.MENU || gameState === GameState.GAME_OVER || gameState === GameState.CUSTOMIZE) && (
        <div className="absolute left-4 right-4 top-5 z-50 flex items-center justify-between gap-2 sm:left-auto sm:right-6 sm:justify-end">
          <button
            onClick={() => {
              setFeedbackView('form');
              setFeedbackOpen(true);
            }}
            className="flex items-center gap-2 rounded-full border border-amber-200/25 bg-slate-950/70 px-3 py-2 text-xs font-bold text-amber-50/85 shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur-md transition-all hover:border-amber-200/50 hover:bg-slate-900/85 hover:text-white"
          >
            <MessageCircle size={14} />
            {t.feedback}
          </button>
          <div className="bg-black/40 backdrop-blur-md rounded-full p-1 flex items-center border border-white/10 shadow-lg">
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
        </div>
      )}

      {feedbackOpen && (
        <div
          className="absolute inset-0 z-[70] flex items-start justify-center bg-black/55 px-4 pt-20 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={() => setFeedbackOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] border border-amber-100/15 bg-[#171421] p-5 text-left shadow-[0_28px_90px_rgba(0,0,0,0.46)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">{t.feedbackTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{t.feedbackHint}</p>
              </div>
              <button onClick={() => setFeedbackOpen(false)} aria-label={t.feedbackClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl font-black leading-none text-slate-400 hover:bg-white/10 hover:text-white">
                ×
              </button>
            </div>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-black/25 p-1">
              <button
                onClick={() => setFeedbackView('form')}
                className={`rounded-full px-3.5 py-2 text-xs font-black transition ${feedbackView === 'form' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                {t.feedbackTabForm}
              </button>
              <button
                onClick={() => setFeedbackView('wechat')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black transition ${feedbackView === 'wechat' ? 'bg-emerald-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                aria-label={t.feedbackWechat}
              >
                <span aria-hidden="true">💬</span>
                <span>{t.feedbackWechat}</span>
              </button>
            </div>

            {feedbackView === 'form' ? (
              <>
                <textarea
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  placeholder={t.feedbackPlaceholder}
                  className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-400/10"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <a href="https://github.com/lizliz404/BrainRush/issues" target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-200/70 hover:text-amber-100">
                    {t.feedbackGithub}
                  </a>
                  <div className="flex items-center gap-3">
                    {feedbackStatus === 'submitted' && <span className="text-xs font-bold text-emerald-300">{t.feedbackSubmitted}</span>}
                    {feedbackStatus === 'error' && <span className="text-xs font-bold text-rose-300">{t.feedbackError}</span>}
                    <button onClick={submitFeedback} disabled={feedbackText.trim().length === 0 || feedbackStatus === 'submitting'} className="rounded-full bg-amber-200 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
                      {feedbackStatus === 'submitting' ? t.feedbackSubmitting : t.feedbackSubmit}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-center">
                <div className="mx-auto flex h-56 w-56 max-w-full items-center justify-center overflow-hidden rounded-2xl border border-emerald-200/20 bg-white p-2 shadow-[0_18px_50px_rgba(16,185,129,0.16)] sm:h-64 sm:w-64">
                  {wechatQrReady ? (
                    <img src="/wechat-qr.png" alt={t.feedbackWechatQrAlt} className="h-full w-full object-cover" onError={() => setWechatQrReady(false)} />
                  ) : (
                    <div className="text-sm font-black leading-6 text-slate-500">{t.feedbackWechatMissing}</div>
                  )}
                </div>
                <p className="mt-3 text-sm font-black text-emerald-100">{t.feedbackWechatHint}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{t.feedbackContact}</p>
              </div>
            )}
          </div>
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
          wordTuning={wordTuning}
          initialLives={DIFFICULTY_CONFIG[difficulty].lives}
          onScoreUpdate={setScore}
          onLivesUpdate={setLives}
          onStatsUpdate={({ correct: nextCorrect, attempts: nextAttempts, accuracy: nextAccuracy, timeLeftSec: nextTimeLeft }) => {
            latestStatsRef.current = {
              correct: nextCorrect,
              attempts: nextAttempts,
              accuracy: nextAccuracy,
            };
            setCorrect(nextCorrect);
            setAttempts(nextAttempts);
            setAccuracy(nextAccuracy);
            setTimeLeftSec(nextTimeLeft);
          }}
          onGameOver={handleGameOver}
          onQuestionUpdate={setCurrentQuestion}
          onQuestionMistake={handleQuestionMistake}
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
            <div className="max-w-[min(92vw,44rem)] bg-white/95 text-game-bg px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in slide-in-from-top-4 duration-300">
              <h1 className={`${getQuestionTextClass()} font-black tracking-tight text-center break-words`}>
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

            <div className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-white">
                  {subjectMode === SubjectMode.MATH ? t.practiceTuning : t.wordPracticeTuning}
                </h3>
                <button
                  onClick={() => setMenuView('tuning')}
                  className="shrink-0 rounded-xl bg-white/10 p-3 text-white transition-all duration-200 hover:bg-white/20 active:scale-95"
                  aria-label={t.openAdvanced}
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
                {subjectMode === SubjectMode.MATH ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setMenuView('tuning')}
                      className="rounded-full bg-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/20 active:scale-95"
                    >
                      {t.wordDirection}: {getWordDirectionLabel(wordTuning.directionMode)}
                    </button>
                    <button
                      onClick={() => setWordTuning(prev => ({ ...prev, allowCloze: !prev.allowCloze }))}
                      className="rounded-full bg-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/20 active:scale-95"
                    >
                      {t.allowCloze}: {getToggleLabel(wordTuning.allowCloze)}
                    </button>
                  </>
                )}
              </div>
            </div>

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
            
            
            <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-500">
              <button type="button" onClick={exportLocalData} className="hover:text-slate-300 transition-colors">
                {t.exportData}
              </button>
              <span className="opacity-30">·</span>
              <button type="button" onClick={clearLocalData} className="hover:text-slate-300 transition-colors">
                {t.clearData}
              </button>
            </div>
            <div className="mt-6 md:mt-8 text-xs md:text-sm text-slate-500">
              {lang === 'zh' ? (
                <>使用 <span className="font-bold text-slate-300">← →</span> 方向键或 <span className="font-bold text-slate-300">拖拽</span> 来移动</>
              ) : (
                <>Use <span className="font-bold text-slate-300">← →</span> arrows or <span className="font-bold text-slate-300">Drag</span> to move</>
              )}
            </div>
            <div className="mt-6">
              {renderMistakeList(currentMistakes)}
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
              <div className="text-left">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">{t.wordPracticeTuning}</h2>
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
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.wordDirection}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: WordDirectionMode.MIXED, label: t.directionMixed },
                      { value: WordDirectionMode.EN_TO_ZH, label: t.directionEnToZh },
                      { value: WordDirectionMode.ZH_TO_EN, label: t.directionZhToEn },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setWordTuning(prev => ({ ...prev, directionMode: option.value }))}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all duration-300 ease-out ${
                          wordTuning.directionMode === option.value
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
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.allowCloze}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[true, false].map(option => (
                      <button
                        key={String(option)}
                        onClick={() => setWordTuning(prev => ({ ...prev, allowCloze: option }))}
                        className={`rounded-2xl border px-4 py-3 text-center transition-all duration-300 ease-out ${
                          wordTuning.allowCloze === option
                            ? 'border-emerald-300 bg-emerald-400/20 text-white shadow-[0_0_0_1px_rgba(52,211,153,0.25)]'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold">{getToggleLabel(option)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                  <p>{t.wordDirection}: <span className="font-bold text-white">{getWordDirectionLabel(wordTuning.directionMode)}</span></p>
                  <p className="mt-2">{t.allowCloze}: <span className="font-bold text-white">{getToggleLabel(wordTuning.allowCloze)}</span></p>
                  <p className="mt-3 text-slate-400">
                    {lang === 'zh'
                      ? '难度会继续决定词汇池层级、选项数，以及句子填空出现频率。'
                      : 'Difficulty still controls the word pool, option count, and cloze frequency.'}
                  </p>
                </div>
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
                    <span className="text-3xl md:text-4xl font-black text-amber-500">{currentHighScore}</span>
                  </div>
                </div>
              )}
              {playMode === PlayMode.QUICK_60 && (
                <div className="mt-4 text-xs font-semibold text-slate-500">
                  {t.quickModeNote}
                </div>
              )}
            </div>
            {playMode === PlayMode.QUICK_60 && renderTimedBoard()}
            {sessionMistakes.length > 0 && <div className="mt-4">{renderMistakeList(sessionMistakes)}</div>}

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
