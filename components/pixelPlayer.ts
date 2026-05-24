import { AvatarConfig } from '../types';

export type PlayerMood = 'idle' | 'happy' | 'hurt' | 'miss';

type PlayerPalette = {
  suit: string;
  trim: string;
  skin: string;
  hair: string;
  shoe: string;
  accent: string;
};

const DEFAULT_PALETTE: PlayerPalette = {
  suit: '#22d3ee',
  trim: '#0f172a',
  skin: '#f8c8a4',
  hair: '#1f2937',
  shoe: '#e2e8f0',
  accent: '#facc15',
};

const OUTFIT_PALETTES: Record<string, Partial<PlayerPalette>> = {
  '😄🎽👟': { suit: '#22d3ee', shoe: '#f8fafc', accent: '#facc15' },
  '🥷🥋🥾': { suit: '#111827', trim: '#334155', hair: '#020617', shoe: '#78350f', accent: '#a78bfa' },
  '😎🧥🛹': { suit: '#f97316', trim: '#7c2d12', hair: '#020617', shoe: '#38bdf8', accent: '#fb7185' },
  '🤖🔋🦿': { suit: '#94a3b8', trim: '#475569', skin: '#cbd5e1', hair: '#64748b', shoe: '#22c55e', accent: '#22d3ee' },
  '👩‍🚀🛰️🥾': { suit: '#e5e7eb', trim: '#64748b', hair: '#7c2d12', shoe: '#78350f', accent: '#60a5fa' },
  '🧠🥼🧪': { suit: '#f8fafc', trim: '#94a3b8', hair: '#a855f7', shoe: '#14b8a6', accent: '#34d399' },
  '🦸⚡🥾': { suit: '#2563eb', trim: '#1e3a8a', hair: '#7c2d12', shoe: '#78350f', accent: '#facc15' },
  '😈🛡️🔥': { suit: '#7f1d1d', trim: '#450a0a', skin: '#c084fc', hair: '#020617', shoe: '#ef4444', accent: '#fb7185' },
};

const getPalette = (avatar: AvatarConfig): PlayerPalette => ({
  ...DEFAULT_PALETTE,
  ...(OUTFIT_PALETTES[`${avatar.head}${avatar.body}${avatar.legs}`] ?? {}),
});

const pixel = (ctx: CanvasRenderingContext2D, x: number, y: number, unit: number, color: string, w = 1, h = 1) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(unit * w), Math.ceil(unit * h));
};

const rect = (ctx: CanvasRenderingContext2D, gridX: number, gridY: number, w: number, h: number, unit: number, originX: number, originY: number, color: string) => {
  pixel(ctx, originX + gridX * unit, originY + gridY * unit, unit, color, w, h);
};

interface DrawPixelPlayerOptions {
  x: number;
  y: number;
  size: number;
  avatar: AvatarConfig;
  mood?: PlayerMood;
  timeMs?: number;
}

export const drawPixelPlayer = (
  ctx: CanvasRenderingContext2D,
  { x, y, size, avatar, mood = 'idle', timeMs = 0 }: DrawPixelPlayerOptions,
) => {
  const palette = getPalette(avatar);
  const bounce = mood === 'happy' ? Math.sin(timeMs / 80) * size * 0.04 : 0;
  const slump = mood === 'hurt' || mood === 'miss' ? size * 0.05 : 0;
  const unit = size / 16;
  const originX = x - unit * 8;
  const originY = y - unit * 10 + bounce + slump;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = mood === 'happy' ? `${palette.accent}88` : 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = mood === 'happy' ? unit * 3.5 : unit * 2;

  // soft ground shadow
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, originY + unit * 19.2, unit * 5.8, unit * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // legs and shoes
  rect(ctx, 5, 13, 2, 4, unit, originX, originY, palette.trim);
  rect(ctx, 9, 13, 2, 4, unit, originX, originY, palette.trim);
  rect(ctx, 4, 17, 3, 1, unit, originX, originY, palette.shoe);
  rect(ctx, 9, 17, 3, 1, unit, originX, originY, palette.shoe);

  // body
  rect(ctx, 4, 7, 8, 6, unit, originX, originY, palette.suit);
  rect(ctx, 5, 7, 6, 1, unit, originX, originY, palette.accent);
  rect(ctx, 3, 8, 1, 4, unit, originX, originY, palette.trim);
  rect(ctx, 12, 8, 1, 4, unit, originX, originY, palette.trim);
  rect(ctx, 6, 9, 4, 2, unit, originX, originY, 'rgba(255,255,255,0.16)');

  // neck + head
  rect(ctx, 7, 6, 2, 1, unit, originX, originY, palette.skin);
  rect(ctx, 5, 1, 6, 5, unit, originX, originY, palette.skin);
  rect(ctx, 4, 2, 1, 3, unit, originX, originY, palette.skin);
  rect(ctx, 11, 2, 1, 3, unit, originX, originY, palette.skin);
  rect(ctx, 5, 0, 6, 2, unit, originX, originY, palette.hair);
  rect(ctx, 4, 1, 2, 1, unit, originX, originY, palette.hair);
  rect(ctx, 10, 1, 2, 1, unit, originX, originY, palette.hair);

  // face states
  const eyeColor = mood === 'hurt' ? '#7f1d1d' : '#0f172a';
  if (mood === 'miss') {
    rect(ctx, 6, 3, 2, 1, unit, originX, originY, eyeColor);
    rect(ctx, 9, 3, 2, 1, unit, originX, originY, eyeColor);
    rect(ctx, 7, 5, 2, 1, unit, originX, originY, eyeColor);
    rect(ctx, 11, 1, 1, 1, unit, originX, originY, '#38bdf8');
    rect(ctx, 12, 2, 1, 2, unit, originX, originY, '#38bdf8');
  } else if (mood === 'hurt') {
    rect(ctx, 6, 3, 1, 1, unit, originX, originY, eyeColor);
    rect(ctx, 10, 3, 1, 1, unit, originX, originY, eyeColor);
    rect(ctx, 7, 5, 3, 1, unit, originX, originY, eyeColor);
  } else {
    rect(ctx, 6, 3, 1, 1, unit, originX, originY, eyeColor);
    rect(ctx, 10, 3, 1, 1, unit, originX, originY, eyeColor);
    if (mood === 'happy') {
      rect(ctx, 7, 5, 1, 1, unit, originX, originY, eyeColor);
      rect(ctx, 8, 6, 2, 1, unit, originX, originY, eyeColor);
      rect(ctx, 10, 5, 1, 1, unit, originX, originY, eyeColor);
      rect(ctx, 12, 0, 1, 1, unit, originX, originY, palette.accent);
      rect(ctx, 13, -1, 1, 1, unit, originX, originY, palette.accent);
    } else {
      rect(ctx, 7, 5, 3, 1, unit, originX, originY, eyeColor);
    }
  }

  ctx.restore();
};
