export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  CUSTOMIZE = 'CUSTOMIZE'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export interface AvatarConfig {
  head: string;
  body: string;
  legs: string;
}

export interface Question {
  text: string;
  answer: number;
  options: number[]; // The values displayed on falling blocks
}

export interface BlockEntity {
  id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  value: number;
  width: number; // Percentage
  height: number; // Percentage (relative to screen aspect)
  isCorrect: boolean;
}

export interface PlayerEntity {
  x: number; // Percentage 0-100 (center point)
  width: number; // Percentage
}

export interface GameConfig {
  speedBase: number; // Speed multiplier
  spawnRate: number; // ms
}