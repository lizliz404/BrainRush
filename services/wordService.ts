import { VOCAB } from '../data/vocab';
import { VOCAB_META } from '../data/vocabMeta';
import { Difficulty, Question, VocabItem, WordDirectionMode, WordTuning } from '../types';
import { getRandomItem, shuffleArray } from '../utils/random';

const DIFFICULTY_ORDER = [
  Difficulty.EASY,
  Difficulty.NORMAL,
  Difficulty.HARD,
  Difficulty.DEVIL,
];

const MAX_EN_LENGTH = 22;
const MAX_ZH_LENGTH = 18;
const MIN_VOCAB_POOL_SIZE = 60;
const NOISY_EN_PATTERN = /[`[\]\\()\u0000-\u0008\u000b\f\u000e-\u001f]|\.{2,}|…|—|=/;
const NOISY_ZH_PATTERN = /[`/[\]\\]|\bp\.\s*\d+\b|\[[^\]]+\]|[a-zA-Z]{3,}|…/i;

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

const pickDifficultyPool = <T extends VocabItem>(items: T[], difficulty: Difficulty, minimumCount = 1): T[] => {
  const allowed = new Set(getAllowedDifficulties(difficulty));
  const filtered = items.filter(item => allowed.has(item.difficulty));
  return filtered.length >= minimumCount ? filtered : items;
};

const normalizeWord = (value: string): string => value.trim().toLowerCase();

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, ' ').trim();

const stripMeaningNoise = (value: string): string => {
  const withoutPageRefs = value
    .replace(/\bp\.\s*\d+\b/gi, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\([^\u4e00-\u9fff)]*\)/g, '')
    .replace(/（[^\u4e00-\u9fff）]*）/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/[.。…]+$/g, '')
    .replace(/\.\.\./g, '')
    .replace(/……/g, '')
    .replace(/^\s*(n|v|a|adj|adv|prep|pron|phr|conj)\.?\s*/i, '');

  return normalizeSpaces(withoutPageRefs)
    .replace(/^[,，;；、.。\s]+|[,，;；、.。\s]+$/g, '')
    .trim();
};

const getMeaningHead = (value: string): string => {
  const cleaned = stripMeaningNoise(value);
  return cleaned.split(/[，,；;、（(]/)[0]?.trim() || cleaned;
};

const isPlayableVocab = (item: VocabItem): boolean => {
  const en = normalizeSpaces(item.en);
  const zh = getMeaningHead(item.zh);

  return Boolean(
    en &&
    zh &&
    en.length <= MAX_EN_LENGTH &&
    zh.length <= MAX_ZH_LENGTH &&
    !NOISY_EN_PATTERN.test(en) &&
    !NOISY_ZH_PATTERN.test(stripMeaningNoise(item.zh)) &&
    /[\u4e00-\u9fff]/.test(zh)
  );
};

const PLAYABLE_VOCAB = VOCAB.filter(isPlayableVocab);

const getPrimaryPos = (item: VocabItem): string => {
  const meta = VOCAB_META[normalizeWord(item.en)];
  return meta?.pos?.split(/[;,/ ]/)[0]?.replace('.', '').trim().toLowerCase() || '';
};

const getDistractorPool = (answer: VocabItem, pool: VocabItem[], direction: 'en' | 'zh'): string[] => {
  const answerPos = getPrimaryPos(answer);
  const samePosItems = answerPos
    ? pool.filter(item => item.en !== answer.en && getPrimaryPos(item) === answerPos)
    : [];
  const source = samePosItems.length >= 8 ? samePosItems : pool.filter(item => item.en !== answer.en);

  return source.map(item => (direction === 'en' ? normalizeSpaces(item.en) : getMeaningHead(item.zh)));
};

const pickOptions = (
  answer: string,
  primaryPool: string[],
  fallbackPool: string[],
  totalOptionsCount: number,
): string[] => {
  const options = new Set<string>([answer]);

  const addCandidate = (candidate: string): void => {
    const normalized = normalizeSpaces(candidate);
    if (normalized && normalized !== answer) {
      options.add(normalized);
    }
  };

  for (const candidate of shuffleArray(primaryPool)) {
    addCandidate(candidate);
    if (options.size >= totalOptionsCount) {
      return shuffleArray(Array.from(options));
    }
  }

  for (const candidate of shuffleArray(fallbackPool)) {
    addCandidate(candidate);
    if (options.size >= totalOptionsCount) {
      break;
    }
  }

  return shuffleArray(Array.from(options));
};

export const generateWordQuestion = (difficulty: Difficulty): Question => {
  return generateWordQuestionWithTuning(difficulty, {
    allowCloze: false,
    directionMode: WordDirectionMode.MIXED,
  });
};

export const generateWordQuestionWithTuning = (difficulty: Difficulty, tuning: WordTuning): Question => {
  const optionCount = getOptionCount(difficulty);
  const vocabPool = pickDifficultyPool(PLAYABLE_VOCAB, difficulty, Math.max(optionCount, MIN_VOCAB_POOL_SIZE));
  const vocab = getRandomItem(vocabPool);
  const isEnToZh =
    tuning.directionMode === WordDirectionMode.EN_TO_ZH
      ? true
      : tuning.directionMode === WordDirectionMode.ZH_TO_EN
        ? false
        : Math.random() < 0.5;
  const allZh = PLAYABLE_VOCAB.map(item => getMeaningHead(item.zh));
  const allEn = PLAYABLE_VOCAB.map(item => normalizeSpaces(item.en));

  if (isEnToZh) {
    const answer = getMeaningHead(vocab.zh);
    return {
      text: normalizeSpaces(vocab.en),
      answer,
      options: pickOptions(answer, getDistractorPool(vocab, vocabPool, 'zh'), allZh, optionCount),
    };
  }

  const answer = normalizeSpaces(vocab.en);
  return {
    text: getMeaningHead(vocab.zh),
    answer,
    options: pickOptions(answer, getDistractorPool(vocab, vocabPool, 'en'), allEn, optionCount),
  };
};
