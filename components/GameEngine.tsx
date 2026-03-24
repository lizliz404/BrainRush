import React, { useEffect, useRef } from 'react';
import { GameState, BlockEntity, PlayerEntity, Difficulty, AvatarConfig, GameTuning, PlayMode } from '../types';
import { generateQuestion } from '../services/mathService';
import { playSuccessSound, playErrorSound } from '../services/audioService';

interface EffectEntity {
  id: number;
  x: number;
  y: number;
  text?: string;
  color: string;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  type: 'text' | 'particle';
}

interface GameEngineProps {
  gameState: GameState;
  difficulty: Difficulty;
  playMode: PlayMode;
  avatar: AvatarConfig;
  tuning: GameTuning;
  initialLives: number;
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onStatsUpdate: (stats: { correct: number; attempts: number; accuracy: number; timeLeftSec: number }) => void;
  onGameOver: (finalScore: number) => void;
  onQuestionUpdate: (q: string) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ 
  gameState, 
  difficulty,
  playMode,
  avatar,
  tuning,
  initialLives,
  onScoreUpdate, 
  onLivesUpdate,
  onStatsUpdate,
  onGameOver,
  onQuestionUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  
  const gameStateRef = useRef(gameState);
  const difficultyRef = useRef(difficulty);
  const playModeRef = useRef(playMode);
  const tuningRef = useRef(tuning);
  const scoreRef = useRef(0);
  const livesRef = useRef(initialLives);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const timeLeftMsRef = useRef(60000);
  
  const playerRef = useRef<PlayerEntity>({ x: 50, width: 8 });
  const blocksRef = useRef<BlockEntity[]>([]);
  const effectsRef = useRef<EffectEntity[]>([]);
  const shakeRef = useRef<number>(0);
  const avatarRef = useRef<AvatarConfig>(avatar);
  const isDeadRef = useRef<boolean>(false);
  
  const isMovingLeft = useRef(false);
  const isMovingRight = useRef(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    playModeRef.current = playMode;
  }, [playMode]);

  useEffect(() => {
    avatarRef.current = avatar;
  }, [avatar]);

  useEffect(() => {
    tuningRef.current = tuning;
  }, [tuning]);

  useEffect(() => {
    livesRef.current = initialLives;
  }, [initialLives]);

  const getViewportMetrics = (w: number, h: number, laneCount: number) => {
    const shortSide = Math.min(w, h);
    const isPortrait = h > w;
    const horizontalPaddingPct = isPortrait ? 8 : 10;
    const availableWidthPct = 100 - horizontalPaddingPct * 2;
    const laneWidthPct = availableWidthPct / Math.max(1, laneCount);
    const blockWidthPct = Math.min(
      laneWidthPct * (isPortrait ? 0.8 : 0.72),
      isPortrait ? 20 : 14
    );
    const playerSizePx = Math.max(shortSide * (isPortrait ? 0.1 : 0.07), 30);
    const playerHalfPct = Math.max((playerSizePx / w) * 52, 4.2);

    return {
      isPortrait,
      horizontalPaddingPct,
      availableWidthPct,
      laneWidthPct,
      blockWidthPct,
      playerSizePx,
      playerHalfPct,
      moveSpeedPct: isPortrait ? 1.15 : 1.0,
      baseDropSpeedPct: isPortrait ? 0.24 : 0.22,
      dropAccelerationPct: isPortrait ? 0.023 : 0.02,
      blockCullY: 112 + (playerSizePx / h) * 100 * 0.9
    };
  };

  const blockSizeClamp = (value: number, laneWidth: number) => {
    const minWidth = Math.max(6.5, laneWidth * 0.5);
    const maxWidth = laneWidth * 0.85;
    return Math.max(minWidth, Math.min(maxWidth, value));
  };

  const spawnQuestion = () => {
    const q = generateQuestion(scoreRef.current, difficultyRef.current, tuningRef.current);
    onQuestionUpdate(q.text);

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas ? canvas.width / dpr : window.innerWidth;
    const h = canvas ? canvas.height / dpr : window.innerHeight;
    const laneCount = q.options.length;
    const metrics = getViewportMetrics(w, h, laneCount);
    const startX = metrics.horizontalPaddingPct;
    const laneWidth = metrics.laneWidthPct;

    const newBlocks: BlockEntity[] = q.options.map((opt, index) => {
      const laneCenter = startX + (index * laneWidth) + (laneWidth / 2);
      const randomOffset = (Math.random() - 0.5) * laneWidth * 0.18;
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        x: laneCenter + randomOffset,
        y: -20 - (Math.random() * 10), 
        value: opt,
        width: blockSizeClamp(metrics.blockWidthPct, laneWidth),
        height: 0, 
        isCorrect: opt === q.answer
      };
    });

    blocksRef.current = newBlocks;
  };

  const handleInput = (clientX: number) => {
    if (gameStateRef.current !== GameState.PLAYING || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const dpr = window.devicePixelRatio || 1;
    const w = canvasRef.current.width / dpr;
    const h = canvasRef.current.height / dpr;
    const laneCount = Math.max(3, blocksRef.current.length || 3);
    const metrics = getViewportMetrics(w, h, laneCount);
    playerRef.current.x = Math.max(metrics.playerHalfPct, Math.min(100 - metrics.playerHalfPct, percentage));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') isMovingLeft.current = true;
      if (e.key === 'ArrowRight' || e.key === 'd') isMovingRight.current = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') isMovingLeft.current = false;
      if (e.key === 'ArrowRight' || e.key === 'd') isMovingRight.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); 
      handleInput(e.touches[0].clientX);
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) { 
        handleInput(e.clientX);
      }
    };
    
    const onHoverMove = (e: MouseEvent) => {
       handleInput(e.clientX);
    };

    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousemove', onHoverMove);

    return () => {
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousemove', onHoverMove);
    };
  }, []);

  const animate = (time: number) => {
    if (previousTimeRef.current === 0) previousTimeRef.current = time;
    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;

    const dt = Math.min(deltaTime, 64); 

    if (gameStateRef.current === GameState.PLAYING) {
      if (playModeRef.current === PlayMode.QUICK_60 && !isDeadRef.current) {
        timeLeftMsRef.current = Math.max(0, timeLeftMsRef.current - dt);
        const timeLeftSec = Math.ceil(timeLeftMsRef.current / 1000);
        const accuracy = attemptsRef.current > 0 ? Math.round((correctRef.current / attemptsRef.current) * 100) : 0;
        onStatsUpdate({
          correct: correctRef.current,
          attempts: attemptsRef.current,
          accuracy,
          timeLeftSec
        });

        if (timeLeftMsRef.current <= 0) {
          isDeadRef.current = true;
          onGameOver(scoreRef.current);
        }
      }
      update(dt);
    }
    
    updateEffects(dt);
    draw();
    
    requestRef.current = requestAnimationFrame(animate);
  };

  const updateEffects = (dt: number) => {
    const timeScale = dt / 16.66;
    if (shakeRef.current > 0) {
      shakeRef.current -= dt;
    }
    effectsRef.current = effectsRef.current.filter(eff => {
      eff.x += eff.vx * timeScale;
      eff.y += eff.vy * timeScale;
      eff.life -= dt;
      return eff.life > 0;
    });
  };

  const update = (dt: number) => {
    if (isDeadRef.current) return;
    const timeScale = dt / 16.66;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const laneCount = Math.max(3, blocksRef.current.length || 3);
    const metrics = getViewportMetrics(w, h, laneCount);
    const moveSpeed = metrics.moveSpeedPct * timeScale;
    if (isMovingLeft.current) playerRef.current.x = Math.max(metrics.playerHalfPct, playerRef.current.x - moveSpeed);
    if (isMovingRight.current) playerRef.current.x = Math.min(100 - metrics.playerHalfPct, playerRef.current.x + moveSpeed);

    let speedMultiplier = 1;
    if (difficultyRef.current === Difficulty.EASY) speedMultiplier = 0.65;
    if (difficultyRef.current === Difficulty.HARD) speedMultiplier = 1.4;
    if (difficultyRef.current === Difficulty.DEVIL) speedMultiplier = 1.9;

    const baseDropSpeed =
      (metrics.baseDropSpeedPct + (scoreRef.current * metrics.dropAccelerationPct)) *
      speedMultiplier *
      timeScale;
    
    let hitBlock: BlockEntity | null = null;
    const nextBlocks: BlockEntity[] = [];

    const px = (playerRef.current.x / 100) * w;
    const py = h * 0.88; 
    const size = metrics.playerSizePx;
    const spacing = size * 0.55; 
    const headY = py - spacing;
    const legsY = py + spacing;

    const playerLeft = px - size * 0.6;
    const playerRight = px + size * 0.6;
    const playerTop = headY - size * 0.4;
    const playerBottom = legsY + size * 0.4;

    for (const block of blocksRef.current) {
      block.y += baseDropSpeed;

      const bx = (block.x / 100) * w;
      const by = (block.y / 100) * h;
      const bW = (block.width / 100) * w;
      const bH = bW * 0.6; 

      const blockLeft = bx - bW / 2;
      const blockRight = bx + bW / 2;
      const blockTop = by;
      const blockBottom = by + bH;

      if (!hitBlock) {
        // Precise collision: Block bottom touches player top
        if (
          blockBottom >= playerTop &&
          blockTop <= playerBottom &&
          blockRight >= playerLeft &&
          blockLeft <= playerRight
        ) {
          hitBlock = block;
        }
      }

      if (block.y < metrics.blockCullY) {
        nextBlocks.push(block);
      }
    }

    blocksRef.current = nextBlocks;

    if (hitBlock) {
      const bx = ((hitBlock as BlockEntity).x / 100) * w;
      const by = ((hitBlock as BlockEntity).y / 100) * h;
      const bW = ((hitBlock as BlockEntity).width / 100) * w;
      const bH = bW * 0.6;
      const blockBottom = by + bH;

      if ((hitBlock as BlockEntity).isCorrect) {
        attemptsRef.current += 1;
        correctRef.current += 1;
        playSuccessSound();
        scoreRef.current += 1;
        onScoreUpdate(scoreRef.current);
        
        // Success Effects
        effectsRef.current.push({
          id: Math.random(),
          type: 'text',
          text: '+1',
          color: '#22c55e',
          x: bx,
          y: by - 10,
          vx: 0,
          vy: -2,
          life: 800,
          maxLife: 800
        });
        
        for(let i=0; i<12; i++) {
          effectsRef.current.push({
            id: Math.random(),
            type: 'particle',
            color: '#22c55e',
            x: bx,
            y: blockBottom,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 400 + Math.random() * 400,
            maxLife: 800
          });
        }

        blocksRef.current = []; 
        spawnQuestion();
      } else {
        attemptsRef.current += 1;
        playErrorSound();
        shakeRef.current = 500; 

        const isTimedMode = playModeRef.current === PlayMode.QUICK_60;
        const nextLives = isTimedMode ? livesRef.current : Math.max(0, livesRef.current - 1);
        if (!isTimedMode) {
          livesRef.current = nextLives;
          onLivesUpdate(nextLives);
        }
        
        // Error Effects
        for(let i=0; i<20; i++) {
          effectsRef.current.push({
            id: Math.random(),
            type: 'particle',
            color: '#ef4444',
            x: px,
            y: headY,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12 - 4,
            life: 600 + Math.random() * 600,
            maxLife: 1200
          });
        }

        effectsRef.current.push({
          id: Math.random(),
          type: 'text',
          text: '-1 ❤',
          color: '#ef4444',
          x: px,
          y: headY - 20,
          vx: 0,
          vy: -2,
          life: 900,
          maxLife: 900
        });

        blocksRef.current = [];

        if (!isTimedMode && nextLives <= 0) {
          isDeadRef.current = true;
          setTimeout(() => {
            onGameOver(scoreRef.current);
          }, 600);
        } else {
          spawnQuestion();
        }
      }
      return;
    } 
    
    if (blocksRef.current.length === 0) {
       attemptsRef.current += 1;
       playErrorSound();
       shakeRef.current = 400;

       const isTimedMode = playModeRef.current === PlayMode.QUICK_60;
       const nextLives = isTimedMode ? livesRef.current : Math.max(0, livesRef.current - 1);
       if (!isTimedMode) {
         livesRef.current = nextLives;
         onLivesUpdate(nextLives);
       }

       effectsRef.current.push({
         id: Math.random(),
         type: 'text',
         text: 'MISS -1 ❤',
         color: '#f97316',
         x: px,
         y: headY - 20,
         vx: 0,
         vy: -2,
         life: 1000,
         maxLife: 1000
       });

       if (!isTimedMode && nextLives <= 0) {
         isDeadRef.current = true;
         setTimeout(() => {
           onGameOver(scoreRef.current);
         }, 600);
       } else {
         spawnQuestion();
       }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    // Screen shake
    if (shakeRef.current > 0) {
      const shakeAmt = (shakeRef.current / 400) * 15; 
      const dx = (Math.random() - 0.5) * shakeAmt;
      const dy = (Math.random() - 0.5) * shakeAmt;
      ctx.translate(dx, dy);
    }

    const px = (playerRef.current.x / 100) * w;
    const py = h * 0.88; 
    const laneCount = Math.max(3, blocksRef.current.length || 3);
    const metrics = getViewportMetrics(w, h, laneCount);
    const size = metrics.playerSizePx; 

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${size * 0.8}px serif`; 
    
    const spacing = size * 0.55; 
    const headY = py - spacing;
    const bodyY = py;
    const legsY = py + spacing;

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    
    ctx.fillText(avatarRef.current.head, px, headY);
    ctx.fillText(avatarRef.current.body, px, bodyY);
    ctx.fillText(avatarRef.current.legs, px, legsY);

    ctx.shadowBlur = 0;

    blocksRef.current.forEach(block => {
      const bx = (block.x / 100) * w;
      const by = (block.y / 100) * h;
      const bW = (block.width / 100) * w;
      const bH = bW * 0.6; 

      ctx.fillStyle = 'white';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bx - bW/2, by, bW, bH, 8);
      } else {
        ctx.rect(bx - bW/2, by, bW, bH);
      }
      ctx.fill();

      ctx.fillStyle = '#1e1b4b'; 
      ctx.font = `bold ${Math.floor(bH * 0.55)}px "Fredoka", sans-serif`;
      ctx.fillText(block.value.toString(), bx, by + bH/2);
    });

    // Draw Effects
    effectsRef.current.forEach(eff => {
      const alpha = Math.max(0, eff.life / eff.maxLife);
      ctx.globalAlpha = alpha;
      if (eff.type === 'text' && eff.text) {
        ctx.fillStyle = eff.color;
        ctx.font = `bold ${Math.min(w, h) * 0.06}px "Fredoka", sans-serif`;
        ctx.fillText(eff.text, eff.x, eff.y);
      } else if (eff.type === 'particle') {
        ctx.fillStyle = eff.color;
        ctx.beginPath();
        ctx.arc(eff.x, eff.y, Math.min(w, h) * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    // Reset transform
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        
        canvasRef.current.style.width = `${window.innerWidth}px`;
        canvasRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []); 

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      scoreRef.current = 0;
      attemptsRef.current = 0;
      correctRef.current = 0;
      timeLeftMsRef.current = 60000;
      livesRef.current = playMode === PlayMode.QUICK_60 ? Number.MAX_SAFE_INTEGER : initialLives;
      playerRef.current = { x: 50, width: 8 };
      blocksRef.current = [];
      effectsRef.current = [];
      shakeRef.current = 0;
      previousTimeRef.current = 0;
      isDeadRef.current = false;
      onScoreUpdate(0);
      onLivesUpdate(playMode === PlayMode.QUICK_60 ? Number.MAX_SAFE_INTEGER : initialLives);
      onStatsUpdate({
        correct: 0,
        attempts: 0,
        accuracy: 0,
        timeLeftSec: 60
      });
      spawnQuestion();
    }
  }, [gameState, initialLives, onLivesUpdate, onScoreUpdate, onStatsUpdate, playMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full block touch-none"
    />
  );
};

export default GameEngine;
