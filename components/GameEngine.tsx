import React, { useEffect, useRef } from 'react';
import { GameState, BlockEntity, PlayerEntity, Difficulty, AvatarConfig } from '../types';
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
  avatar: AvatarConfig;
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onQuestionUpdate: (q: string) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ 
  gameState, 
  difficulty,
  avatar,
  onScoreUpdate, 
  onGameOver,
  onQuestionUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(0);
  
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
    avatarRef.current = avatar;
  }, [avatar]);

  const spawnQuestion = () => {
    const q = generateQuestion(scoreRef.current, difficulty);
    onQuestionUpdate(q.text);

    const laneCount = q.options.length;
    const availableWidth = 80; 
    const startX = 10;
    const laneWidth = availableWidth / laneCount;

    const newBlocks: BlockEntity[] = q.options.map((opt, index) => {
      const laneCenter = startX + (index * laneWidth) + (laneWidth / 2);
      const randomOffset = (Math.random() * 4) - 2; 
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        x: laneCenter + randomOffset,
        y: -20 - (Math.random() * 10), 
        value: opt,
        width: 18, // Responsive width percentage (increased for mobile)
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
    playerRef.current.x = Math.max(8, Math.min(92, percentage));
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

    const moveSpeed = 1.2 * timeScale;
    if (isMovingLeft.current) playerRef.current.x = Math.max(8, playerRef.current.x - moveSpeed);
    if (isMovingRight.current) playerRef.current.x = Math.min(92, playerRef.current.x + moveSpeed);

    let speedMultiplier = 1;
    if (difficulty === Difficulty.EASY) speedMultiplier = 0.7;
    if (difficulty === Difficulty.HARD) speedMultiplier = 1.4;

    const baseDropSpeed = (0.25 + (scoreRef.current * 0.025)) * speedMultiplier * timeScale;
    
    let hitBlock: BlockEntity | null = null;
    const nextBlocks: BlockEntity[] = [];

    const px = (playerRef.current.x / 100) * w;
    const py = h * 0.88; 
    const isPortrait = h > w;
    const size = isPortrait ? w * 0.12 : Math.min(w, h) * 0.08; // Responsive size
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

      if (block.y < 120) {
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
        isDeadRef.current = true;
        playErrorSound();
        shakeRef.current = 500; 
        
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
        
        setTimeout(() => {
          onGameOver(scoreRef.current);
        }, 600);
      }
      return;
    } 
    
    if (blocksRef.current.length === 0) {
       isDeadRef.current = true;
       setTimeout(() => {
         onGameOver(scoreRef.current);
       }, 600);
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
    const isPortrait = h > w;
    const size = isPortrait ? w * 0.12 : Math.min(w, h) * 0.08; 

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
      playerRef.current = { x: 50, width: 8 };
      blocksRef.current = [];
      effectsRef.current = [];
      shakeRef.current = 0;
      previousTimeRef.current = 0;
      isDeadRef.current = false;
      spawnQuestion();
    }
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full block touch-none"
    />
  );
};

export default GameEngine;
