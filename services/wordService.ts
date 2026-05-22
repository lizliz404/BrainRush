import { CLOZE_SET } from '../data/cloze';
import { VOCAB } from '../data/vocab';
import { VOCAB_META } from '../data/vocabMeta';
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

const normalizeWord = (value: string): string => value.trim().toLowerCase();

const getPrimaryPos = (item: VocabItem): string => {
  const meta = VOCAB_META[normalizeWord(item.en)];
  return meta?.pos?.split(/[;,/ ]/)[0]?.replace('.', '').trim().toLowerCase() || '';
};

const getMeaningHead = (value: string): string => value.split(/[，,；;、（(]/)[0]?.trim() || value.trim();

const getDistractorPool = (answer: VocabItem, pool: VocabItem[], direction: 'en' | 'zh'): string[] => {
  const answerPos = getPrimaryPos(answer);
  const samePosItems = answerPos
    ? pool.filter(item => item.en !== answer.en && getPrimaryPos(item) === answerPos)
    : [];
  const source = samePosItems.length >= 8 ? samePosItems : pool.filter(item => item.en !== answer.en);

  return source.map(item => (direction === 'en' ? item.en : getMeaningHead(item.zh)));
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
  const allZh = VOCAB.map(item => getMeaningHead(item.zh));
  const allEn = VOCAB.map(item => item.en);

  if (isEnToZh) {
    const answer = getMeaningHead(vocab.zh);
    return {
      text: vocab.en,
      answer,
      options: pickOptions(answer, getDistractorPool(vocab, vocabPool, 'zh'), allZh, optionCount),
    };
  }

  return {
    text: vocab.zh,
    answer: vocab.en,
    options: pickOptions(vocab.en, getDistractorPool(vocab, vocabPool, 'en'), allEn, optionCount),
  };
};
