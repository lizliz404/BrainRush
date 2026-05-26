import { GameFeelTuning } from '../types';

export type AnswerBlockRange = readonly [min: number, max: number];

export const ANSWER_BLOCK_RANGES: Record<GameFeelTuning['blockLoad'], AnswerBlockRange> = {
  low: [2, 2],
  normal: [2, 4],
  high: [3, 5],
};

export const pickAnswerBlockCount = (
  blockLoad: GameFeelTuning['blockLoad'],
  random: () => number = Math.random,
): number => {
  const [min, max] = ANSWER_BLOCK_RANGES[blockLoad] ?? ANSWER_BLOCK_RANGES.normal;
  return min + Math.floor(random() * (max - min + 1));
};
