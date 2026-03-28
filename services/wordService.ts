import { CLOZE_SET } from '../data/cloze';
import { VOCAB } from '../data/vocab';
import { ClozeItem, Difficulty, Question, VocabItem, WordDirectionMode, WordTuning } from '../types';
import { getRandomItem, shuffleArray } from '../utils/random';

const DIFFICULTY_ORDER = [
  Difficulty.EASY,
  Difficulty.NORMAL,
  Difficulty.HARD,
  Difficulty.DEVIL,
];

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

const getAllowedDifficulties = (difficulty: Difficulty): Difficulty[] => {
  const maxIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  return DIFFICULTY_ORDER.slice(0, maxIndex + 1);
};

const pickDifficultyPool = <T extends VocabItem | ClozeItem>(items: T[], difficulty: Difficulty, minimumCount = 1): T[] => {
  const allowed = new Set(getAllowedDifficulties(difficulty));
  const filtered = items.filter(item => allowed.has(item.difficulty));
  return filtered.length >= minimumCount ? filtered : items;
};

const getClozeChance = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case Difficulty.EASY:
      return 0;
    case Difficulty.NORMAL:
      return 0.15;
    case Difficulty.HARD:
      return 0.35;
    case Difficulty.DEVIL:
      return 0.55;
    default:
      return 0.2;
  }
};

const pickOptions = (
  answer: string,
  primaryPool: string[],
  fallbackPool: string[],
  totalOptionsCount: number,
): string[] => {
  const options = new Set<string>([answer]);

  for (const candidate of shuffleArray(primaryPool)) {
    if (candidate !== answer) {
      options.add(candidate);
    }
    if (options.size >= totalOptionsCount) {
      return shuffleArray(Array.from(options));
    }
  }

  for (const candidate of shuffleArray(fallbackPool)) {
    if (candidate !== answer) {
      options.add(candidate);
    }
    if (options.size >= totalOptionsCount) {
      break;
    }
  }

  return shuffleArray(Array.from(options));
};

export const generateWordQuestion = (difficulty: Difficulty): Question => {
  return generateWordQuestionWithTuning(difficulty, {
    allowCloze: true,
    directionMode: WordDirectionMode.MIXED,
  });
};

export const generateWordQuestionWithTuning = (difficulty: Difficulty, tuning: WordTuning): Question => {
  const optionCount = getOptionCount(difficulty);
  const clozePool = pickDifficultyPool(CLOZE_SET, difficulty);
  const vocabPool = pickDifficultyPool(VOCAB, difficulty, optionCount);
  const useCloze = tuning.allowCloze && clozePool.length > 0 && Math.random() < getClozeChance(difficulty);

  if (useCloze) {
    const cloze = getRandomItem(clozePool);
    return {
      text: `${cloze.sentence} (${cloze.zhHint})`,
      answer: cloze.answer,
      options: pickOptions(cloze.answer, cloze.distractors, VOCAB.map(item => item.en), optionCount),
    };
  }

  const vocab = getRandomItem(vocabPool);
  const isEnToZh =
    tuning.directionMode === WordDirectionMode.EN_TO_ZH
      ? true
      : tuning.directionMode === WordDirectionMode.ZH_TO_EN
        ? false
        : Math.random() < 0.5;
  const zhPool = vocabPool.map(item => item.zh);
  const enPool = vocabPool.map(item => item.en);
  const allZh = VOCAB.map(item => item.zh);
  const allEn = VOCAB.map(item => item.en);

  if (isEnToZh) {
    return {
      text: vocab.en,
      answer: vocab.zh,
      options: pickOptions(vocab.zh, zhPool, allZh, optionCount),
    };
  }

  return {
    text: vocab.zh,
    answer: vocab.en,
    options: pickOptions(vocab.en, enPool, allEn, optionCount),
  };
};
