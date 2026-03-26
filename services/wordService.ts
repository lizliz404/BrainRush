import { CLOZE_SET } from '../data/cloze';
import { VOCAB } from '../data/vocab';
import { Difficulty, Question } from '../types';
import { getRandomItem, shuffleArray } from '../utils/random';

const getOptionCount = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case Difficulty.EASY:
      return 3;
    case Difficulty.NORMAL:
      return 4;
    case Difficulty.HARD:
    case Difficulty.DEVIL:
      return 5;
    default:
      return 4;
  }
};

const pickOptions = (answer: string, pool: string[], totalOptionsCount: number): string[] => {
  const validDistractors = pool.filter(item => item !== answer);
  const shuffledDistractors = shuffleArray(validDistractors);
  const selectedDistractors = shuffledDistractors.slice(0, Math.max(0, totalOptionsCount - 1));
  return shuffleArray([answer, ...selectedDistractors]);
};

export const generateWordQuestion = (difficulty: Difficulty): Question => {
  const optionCount = getOptionCount(difficulty);
  const useCloze = (difficulty === Difficulty.HARD || difficulty === Difficulty.DEVIL) && Math.random() < 0.35;

  if (useCloze) {
    const cloze = getRandomItem(CLOZE_SET);
    return {
      text: `${cloze.sentence} (${cloze.zhHint})`,
      answer: cloze.answer,
      options: pickOptions(cloze.answer, cloze.distractors, optionCount),
    };
  }

  const vocab = getRandomItem(VOCAB);
  const isEnToZh = Math.random() < 0.5;

  if (isEnToZh) {
    return {
      text: `选择中文：${vocab.en}`,
      answer: vocab.zh,
      options: pickOptions(vocab.zh, VOCAB.map(item => item.zh), optionCount),
    };
  }

  return {
    text: `选出英文：${vocab.zh}`,
    answer: vocab.en,
    options: pickOptions(vocab.en, VOCAB.map(item => item.en), optionCount),
  };
};
