export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  CUSTOMIZE = 'CUSTOMIZE'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  DEVIL = 'DEVIL'
}

export enum OperationFocus {
  RANDOM = 'RANDOM',
  ADD_SUB = 'ADD_SUB',
  MUL_DIV = 'MUL_DIV'
}

export enum NumberRangeMode {
  RANDOM = 'RANDOM',
  WITHIN_10 = 'WITHIN_10',
  WITHIN_20 = 'WITHIN_20',
  ABOVE_50 = 'ABOVE_50'
}

export interface GameTuning {
  operationFocus: OperationFocus;
  numberRange: NumberRangeMode;
  allowRemainder: boolean;
  allowNegative: boolean;
}

export interface AvatarConfig {
  head: string;
  body: string;
  legs: string;
}

export interface Question {
  text: string;
  answer: string;
  options: string[]; // The values displayed on falling blocks
}

export interface BlockEntity {
  id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  value: string;
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
