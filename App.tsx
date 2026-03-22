import React, { useState, useEffect } from 'react';
import { GameState, Difficulty, AvatarConfig } from './types';
import GameEngine from './components/GameEngine';
import { Play, RotateCcw, BrainCircuit, Trophy, Settings, Lock, ArrowLeft, Shirt } from 'lucide-react';
import { initAudio } from './services/audioService';

type Language = 'en' | 'zh';

const TRANSLATIONS = {
  en: {
    title: 'Brain Rush',
    subtitle: 'Solve fast. Move faster.',
    difficulty: 'Difficulty',
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
    movePrompt: 'Move to the Correct Answer'
  },
  zh: {
    title: '头脑冲刺',
    subtitle: '算得快，躲得更快。',
    difficulty: '难度',
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
    movePrompt: '移动到正确答案下方'
  }
};

const UNLOCKABLE_SETS = [
  { score: 0, head: '😃', body: '👕', legs: '👖' },
  { score: 10, head: '😎', body: '🧥', legs: '🩳' },
  { score: 20, head: '🤖', body: '🥋', legs: '🦿' },
  { score: 30, head: '👽', body: '🥼', legs: '👢' },
  { score: 40, head: '🤠', body: '👔', legs: '🩲' },
  { score: 50, head: '🎃', body: '👗', legs: '👠' },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
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

  // Save when changed
  useEffect(() => {
    localStorage.setItem('brainRushHighScore', highScore.toString());
  }, [highScore]);

  useEffect(() => {
    localStorage.setItem('brainRushAvatar', JSON.stringify(avatar));
  }, [avatar]);

  const startGame = () => {
    initAudio();
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    setHighScore(prev => finalScore > prev ? finalScore : prev);
  };

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
    <div className="relative w-full h-screen overflow-hidden bg-game-bg text-game-text font-sans selection:bg-none">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#1e1b4b] to-black opacity-80 z-0"></div>

      {/* Language Switcher */}
      {(gameState === GameState.MENU || gameState === GameState.GAME_OVER) && (
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
          avatar={avatar}
          onScoreUpdate={setScore}
          onGameOver={handleGameOver}
          onQuestionUpdate={setCurrentQuestion}
        />
      </div>

      {/* UI Overlay - HUD */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            
            {/* Score Pill */}
            <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-lg">
              <span className="text-xl font-bold text-game-accent">{t.score}: {score}</span>
            </div>

            {/* Question Card */}
            <div className="bg-white/95 text-game-bg px-8 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in slide-in-from-top-4 duration-300">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-center whitespace-nowrap">
                {currentQuestion}
              </h1>
            </div>
            
            <p className="text-white/50 text-sm font-semibold tracking-wide uppercase mt-2 animate-pulse">
               {t.movePrompt}
            </p>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl text-center max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-game-accent rounded-2xl shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)]">
                <BrainCircuit size={48} className="text-white md:w-16 md:h-16" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              {t.title}
            </h1>
            <p className="text-slate-300 text-base md:text-lg mb-8 font-medium">{t.subtitle}</p>

            {/* Difficulty Selector */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.difficulty}</h3>
              <div className="flex bg-black/40 rounded-xl p-1">
                {Object.values(Difficulty).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
                      difficulty === diff 
                        ? 'bg-white text-game-bg shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {diff === Difficulty.EASY ? (lang === 'zh' ? '简单' : 'EASY') : 
                     diff === Difficulty.NORMAL ? (lang === 'zh' ? '普通' : 'NORMAL') : 
                     (lang === 'zh' ? '困难' : 'HARD')}
                  </button>
                ))}
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
              onClick={() => setGameState(GameState.CUSTOMIZE)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-base md:text-lg py-3 md:py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
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
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-red-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white text-game-bg p-6 md:p-8 rounded-3xl shadow-2xl text-center max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <h2 className="text-3xl md:text-4xl font-black text-game-wrong mb-2">{t.gameOver}</h2>
            <p className="text-slate-500 font-bold mb-6 text-sm md:text-base">{t.missed}</p>
            
            <div className="bg-slate-100 rounded-2xl p-4 md:p-6 mb-8 flex justify-around">
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

            <button 
              onClick={startGame}
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
