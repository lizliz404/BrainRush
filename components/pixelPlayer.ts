import { AvatarConfig } from '../types';

export type PlayerMood = 'idle' | 'happy' | 'hurt' | 'miss';

type PlayerPalette = {
  suit: string;
  trim: string;
  skin: string;
  hair: string;
  shoe: string;
  accent: string;
  cape?: string;
};

const DEFAULT_PALETTE: PlayerPalette = {
  suit: '#22d3ee',
  trim: '#0f172a',
  skin: '#f8c8a4',
  hair: '#1f2937',
  shoe: '#e2e8f0',
  accent: '#facc15',
};

const HEAD_PALETTES: Record<string, Partial<PlayerPalette>> = {
  '🥷': { skin: '#111827', hair: '#020617', accent: '#a78bfa' },
  '😎': { hair: '#020617', accent: '#fb7185' },
  '🤖': { skin: '#cbd5e1', hair: '#64748b', accent: '#22d3ee' },
  '👩‍🚀': { hair: '#7c2d12', accent: '#60a5fa' },
  '🧠': { hair: '#a855f7', accent: '#34d399' },
  '🦸': { hair: '#7c2d12', accent: '#facc15', cape: '#dc2626' },
  '😈': { skin: '#c084fc', hair: '#020617', accent: '#fb7185' },
};

const BODY_PALETTES: Record<string, Partial<PlayerPalette>> = {
  '🎽': { suit: '#22d3ee', trim: '#0f172a' },
  '🥋': { suit: '#111827', trim: '#334155' },
  '🧥': { suit: '#f97316', trim: '#7c2d12' },
  '🔋': { suit: '#94a3b8', trim: '#475569' },
  '🛰️': { suit: '#e5e7eb', trim: '#64748b' },
  '🥼': { suit: '#f8fafc', trim: '#94a3b8' },
  '⚡': { suit: '#2563eb', trim: '#1e3a8a', cape: '#dc2626' },
  '🛡️': { suit: '#7f1d1d', trim: '#450a0a' },
};

const LEGS_PALETTES: Record<string, Partial<PlayerPalette>> = {
  '👟': { shoe: '#f8fafc' },
  '🥾': { shoe: '#78350f' },
  '🛹': { shoe: '#38bdf8' },
  '🦿': { shoe: '#22c55e' },
  '🧪': { shoe: '#14b8a6' },
  '🔥': { shoe: '#ef4444' },
};

const getPalette = (avatar: AvatarConfig): PlayerPalette => ({
  ...DEFAULT_PALETTE,
  ...(HEAD_PALETTES[avatar.head] ?? {}),
  ...(BODY_PALETTES[avatar.body] ?? {}),
  ...(LEGS_PALETTES[avatar.legs] ?? {}),
});

const gridRect = (
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  w: number,
  h: number,
  color: string,
) => {
  ctx.fillStyle = color;
  ctx.fillRect(gridX, gridY, w, h);
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
  const bounce = mood === 'happy' ? Math.sin(timeMs / 80) * size * 0.045 : 0;
  const slump = mood === 'hurt' || mood === 'miss' ? size * 0.045 : 0;
  const unit = Math.max(2, Math.round(size / 18));
  const originX = Math.round(x - unit * 8.5);
  const originY = Math.round(y - unit * 10.5 + bounce + slump);
  const isRobot = avatar.head === '🤖';
  const isNinja = avatar.head === '🥷';
  const isAstronaut = avatar.head === '👩‍🚀';
  const isBoss = avatar.head === '😈';
  const isHero = avatar.body === '⚡' || avatar.head === '🦸';

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(originX, originY);
  ctx.scale(unit, unit);
  ctx.shadowColor = mood === 'happy' ? `${palette.accent}99` : 'rgba(0,0,0,0.38)';
  ctx.shadowBlur = mood === 'happy' ? 4 : 2;

  // soft ground shadow
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(8.5, 19.2, 6, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (palette.cape) {
    gridRect(ctx, 3, 8, 2, 8, palette.cape);
    gridRect(ctx, 4, 15, 3, 2, palette.cape);
  }

  // legs and shoes
  gridRect(ctx, 5, 13, 2, 4, palette.trim);
  gridRect(ctx, 10, 13, 2, 4, palette.trim);
  gridRect(ctx, 4, 17, 4, 1, palette.shoe);
  gridRect(ctx, 9, 17, 4, 1, palette.shoe);

  // body silhouette
  gridRect(ctx, 4, 7, 9, 6, palette.suit);
  gridRect(ctx, 5, 7, 7, 1, palette.accent);
  gridRect(ctx, 3, 8, 1, 4, palette.trim);
  gridRect(ctx, 13, 8, 1, 4, palette.trim);
  gridRect(ctx, 6, 9, 5, 2, 'rgba(255,255,255,0.15)');

  if (isHero) {
    gridRect(ctx, 8, 8, 1, 3, '#fef08a');
    gridRect(ctx, 7, 10, 2, 1, '#fef08a');
  }
  if (avatar.body === '🔋') {
    gridRect(ctx, 7, 9, 3, 3, '#22c55e');
    gridRect(ctx, 8, 8, 1, 1, '#bbf7d0');
  }
  if (avatar.body === '🥼') {
    gridRect(ctx, 5, 8, 1, 5, '#e2e8f0');
    gridRect(ctx, 11, 8, 1, 5, '#e2e8f0');
  }

  // neck + head
  gridRect(ctx, 7, 6, 3, 1, palette.skin);
  gridRect(ctx, 5, 1, 7, 5, palette.skin);
  gridRect(ctx, 4, 2, 1, 3, palette.skin);
  gridRect(ctx, 12, 2, 1, 3, palette.skin);
  gridRect(ctx, 5, 0, 7, 2, palette.hair);
  gridRect(ctx, 4, 1, 2, 1, palette.hair);
  gridRect(ctx, 11, 1, 2, 1, palette.hair);

  if (isAstronaut) {
    gridRect(ctx, 4, 0, 9, 1, '#e2e8f0');
    gridRect(ctx, 4, 1, 1, 5, '#e2e8f0');
    gridRect(ctx, 12, 1, 1, 5, '#e2e8f0');
    gridRect(ctx, 5, 5, 7, 1, '#e2e8f0');
  }
  if (isRobot) {
    gridRect(ctx, 4, 2, 1, 1, '#38bdf8');
    gridRect(ctx, 12, 2, 1, 1, '#38bdf8');
    gridRect(ctx, 8, -1, 1, 1, '#22d3ee');
  }
  if (isNinja) {
    gridRect(ctx, 5, 2, 7, 2, '#020617');
  }
  if (isBoss) {
    gridRect(ctx, 4, 0, 1, 1, '#f87171');
    gridRect(ctx, 12, 0, 1, 1, '#f87171');
    gridRect(ctx, 3, -1, 1, 1, '#f87171');
    gridRect(ctx, 13, -1, 1, 1, '#f87171');
  }

  // face states
  const eyeColor = mood === 'hurt' ? '#7f1d1d' : '#0f172a';
  if (mood === 'miss') {
    gridRect(ctx, 6, 3, 2, 1, eyeColor);
    gridRect(ctx, 10, 3, 2, 1, eyeColor);
    gridRect(ctx, 7, 5, 3, 1, eyeColor);
    gridRect(ctx, 12, 1, 1, 1, '#38bdf8');
    gridRect(ctx, 13, 2, 1, 2, '#38bdf8');
  } else if (mood === 'hurt') {
    gridRect(ctx, 6, 3, 1, 1, eyeColor);
    gridRect(ctx, 11, 3, 1, 1, eyeColor);
    gridRect(ctx, 7, 5, 4, 1, eyeColor);
  } else {
    gridRect(ctx, 6, 3, 1, 1, eyeColor);
    gridRect(ctx, 11, 3, 1, 1, eyeColor);
    if (mood === 'happy') {
      gridRect(ctx, 7, 5, 1, 1, eyeColor);
      gridRect(ctx, 8, 6, 3, 1, eyeColor);
      gridRect(ctx, 11, 5, 1, 1, eyeColor);
      gridRect(ctx, 13, 0, 1, 1, palette.accent);
      gridRect(ctx, 14, -1, 1, 1, palette.accent);
    } else {
      gridRect(ctx, 7, 5, 4, 1, eyeColor);
    }
  }

  ctx.restore();
};
