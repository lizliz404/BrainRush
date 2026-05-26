import React, { useEffect, useRef } from 'react';
import { AvatarConfig } from '../types';
import { drawPixelPlayer } from './pixelPlayer';

interface PixelPlayerPreviewProps {
  avatar: AvatarConfig;
  className?: string;
}

const PixelPlayerPreview: React.FC<PixelPlayerPreviewProps> = ({ avatar, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 144;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawPixelPlayer(ctx, {
      x: size / 2,
      y: size * 0.58,
      size: size * 0.72,
      avatar,
      mood: 'waiting',
      timeMs: performance.now(),
    });
  }, [avatar]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default PixelPlayerPreview;
