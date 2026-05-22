import { Question, Difficulty, GameTuning, NumberRangeMode, OperationFocus } from '../types';
import { shuffleArray } from '../utils/random';

type DifficultyShape = {
  baseDifficulty: number;
  optionCount: number;
};

const DIFFICULTY_SHAPES: Record<Difficulty, (score: number) => DifficultyShape> = {
  [Difficulty.EASY]: (score) => ({ baseDifficulty: Math.min(Math.floor(score / 8), 5), optionCount: 3 }),
  [Difficulty.NORMAL]: (score) => ({ baseDifficulty: Math.min(Math.floor(score / 5), 10), optionCount: 4 }),
  [Difficulty.HARD]: (score) => ({ baseDifficulty: Math.min(Math.floor(score / 3) + 4, 16), optionCount: 5 }),
  [Difficulty.DEVIL]: (score) => ({ baseDifficulty: Math.min(Math.floor(score / 2) + 7, 21), optionCount: 5 }),
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const getOperationPool = (difficulty: number, difficultySetting: Difficulty, tuning: GameTuning): string[] => {
  if (tuning.operationFocus === OperationFocus.ADD_SUB) {
    return ['+', '-'];
  }

  if (tuning.operationFocus === OperationFocus.MUL_DIV) {
    if (tuning.allowRemainder) {
      return ['/'];
    }
    return difficultySetting === Difficulty.EASY ? ['*'] : ['*', '/'];
  }

  const operations = ['+', '-'];
  if (difficulty > 3) operations.push('*');
  if (difficultySetting === Difficulty.DEVIL || difficulty > 10) operations.push('/');
  if (tuning.allowRemainder && !operations.includes('/')) operations.push('/');
  return operations;
};

const getRandomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRangePreset = (difficulty: number, rangeMode: NumberRangeMode) => {
  switch (rangeMode) {
    case NumberRangeMode.WITHIN_10:
      return { min: 0, max: 10 };
    case NumberRangeMode.WITHIN_20:
      return { min: 0, max: 20 };
    case NumberRangeMode.ABOVE_50:
      return { min: 50, max: 120 + difficulty * 8 };
    case NumberRangeMode.RANDOM:
    default:
      return { min: 0, max: 10 + difficulty * 5 };
  }
};

const formatAnswer = (value: number): string => value.toString();

const formatRemainderAnswer = (quotient: number, remainder: number): string => `${quotient}……${remainder}`;

export const getMathDifficultyShape = (score: number, difficultySetting: Difficulty): DifficultyShape =>
  DIFFICULTY_SHAPES[difficultySetting](score);

export const generateQuestion = (
  score: number,
  difficultySetting: Difficulty = Difficulty.NORMAL,
  tuning: GameTuning = {
    operationFocus: OperationFocus.RANDOM,
    numberRange: NumberRangeMode.RANDOM,
    allowRemainder: false,
    allowNegative: false,
  }
): Question => {
  const { baseDifficulty, optionCount } = getMathDifficultyShape(score, difficultySetting);
  const difficulty = baseDifficulty;
  const rangePreset = getRangePreset(difficulty, tuning.numberRange);
  const operations = getOperationPool(difficulty, difficultySetting, tuning);
  
  const operator = operations[Math.floor(Math.random() * operations.length)];
  
  let a = 0, b = 0;
  let answerValue = 0;
  let answer = '';
  let text = '';

  // Generate numbers based on operator and difficulty
  switch (operator) {
    case '+':
      a = getRandomInt(Math.max(1, rangePreset.min || 1), Math.max(2, rangePreset.max));
      b = getRandomInt(Math.max(1, rangePreset.min || 1), Math.max(2, rangePreset.max));
      answerValue = a + b;
      answer = formatAnswer(answerValue);
      text = `${a} + ${b} = ?`;
      break;
    case '-':
      if (tuning.allowNegative) {
        a = getRandomInt(
          Math.max(0, tuning.numberRange === NumberRangeMode.ABOVE_50 ? 40 : 0),
          Math.max(10, rangePreset.max)
        );
        b = getRandomInt(
          Math.max(1, tuning.numberRange === NumberRangeMode.ABOVE_50 ? 50 : 1),
          Math.max(a + 15, rangePreset.max + 20)
        );
      } else {
        a = getRandomInt(
          Math.max(5, tuning.numberRange === NumberRangeMode.ABOVE_50 ? 50 : 5),
          Math.max(10, rangePreset.max + (tuning.numberRange === NumberRangeMode.ABOVE_50 ? 20 : 5))
        );
        b = getRandomInt(
          tuning.numberRange === NumberRangeMode.ABOVE_50 ? 10 : 0,
          Math.max(tuning.numberRange === NumberRangeMode.ABOVE_50 ? 20 : 1, a - 1)
        );
      }
      answerValue = a - b;
      answer = formatAnswer(answerValue);
      text = `${a} - ${b} = ?`;
      break;
    case '*': {
      const factorMax =
        tuning.numberRange === NumberRangeMode.WITHIN_10
          ? 10
          : tuning.numberRange === NumberRangeMode.WITHIN_20
            ? 12
            : tuning.numberRange === NumberRangeMode.ABOVE_50
              ? 18
              : clamp(6 + difficulty, 8, 18);
      const factorMin = tuning.numberRange === NumberRangeMode.ABOVE_50 ? 4 : difficultySetting === Difficulty.EASY ? 2 : 3;
      a = getRandomInt(factorMin, factorMax);
      b = getRandomInt(factorMin, factorMax);
      answerValue = a * b;
      if (tuning.numberRange === NumberRangeMode.ABOVE_50 && answerValue < 50) {
        answerValue = answerValue + 50;
        a = answerValue;
        b = 1;
      }
      answer = formatAnswer(answerValue);
      text = `${a} × ${b} = ?`;
      break;
    }
    case '/': {
      const divisorMax =
        tuning.numberRange === NumberRangeMode.WITHIN_10
          ? 10
          : tuning.numberRange === NumberRangeMode.WITHIN_20
            ? 12
            : 14;
      b = getRandomInt(2, divisorMax);
      const quotient =
        tuning.numberRange === NumberRangeMode.WITHIN_10
          ? getRandomInt(1, 10)
          : tuning.numberRange === NumberRangeMode.WITHIN_20
            ? getRandomInt(2, 20)
            : tuning.numberRange === NumberRangeMode.ABOVE_50
              ? getRandomInt(50, 100 + difficulty * 4)
              : getRandomInt(difficultySetting === Difficulty.EASY ? 2 : 3, clamp(9 + difficulty, 10, 28));
      const remainder = tuning.allowRemainder ? getRandomInt(1, b - 1) : 0;
      answerValue = quotient;
      answer = tuning.allowRemainder
        ? formatRemainderAnswer(quotient, remainder)
        : formatAnswer(quotient);
      a = quotient * b + remainder;
      text = `${a} ÷ ${b} = ?`;
      break;
    }
  }

  // Generate wrong options that are close to the answer
  const options = new Set<string>();
  options.add(answer);

  while (options.size < optionCount) {
    if (operator === '/' && tuning.allowRemainder) {
      const quotientOffset = getRandomInt(0, 3);
      const remainderBase = getRandomInt(1, Math.max(2, b - 1));
      const quotientDirection = Math.random() > 0.5 ? 1 : -1;
      const wrongQuotient = Math.max(0, answerValue + quotientOffset * quotientDirection);
      const wrongRemainder = Math.min(Math.max(1, remainderBase), Math.max(1, b - 1));
      const wrongAnswer = formatRemainderAnswer(wrongQuotient, wrongRemainder);
      if (wrongAnswer !== answer) options.add(wrongAnswer);
      continue;
    }

    const offsetRange =
      tuning.numberRange === NumberRangeMode.ABOVE_50
        ? 20
        : difficultySetting === Difficulty.DEVIL
          ? 10
          : difficulty > 10
            ? 8
            : 5;
    const offset = Math.floor(Math.random() * offsetRange) + 1;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const wrong = answerValue + (offset * direction);

    if (!tuning.allowNegative && wrong < 0) {
      continue;
    }

    options.add(formatAnswer(wrong));
  }

  // Convert Set to Array and shuffle
  const shuffledOptions = shuffleArray(Array.from(options));

  return {
    text,
    answer,
    options: shuffledOptions
  };
};
