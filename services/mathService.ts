import { Question, Difficulty, GameTuning, NumberRangeMode, OperationFocus } from '../types';

const getOperationPool = (difficulty: number, difficultySetting: Difficulty, tuning: GameTuning): string[] => {
  if (tuning.operationFocus === OperationFocus.ADD_SUB) {
    return ['+', '-'];
  }

  if (tuning.operationFocus === OperationFocus.MUL_DIV) {
    return difficultySetting === Difficulty.EASY ? ['*'] : ['*', '/'];
  }

  const operations = ['+', '-'];
  if (difficulty > 3) operations.push('*');
  if (difficultySetting === Difficulty.DEVIL || difficulty > 10) operations.push('/');
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

export const generateQuestion = (
  score: number,
  difficultySetting: Difficulty = Difficulty.NORMAL,
  tuning: GameTuning = {
    operationFocus: OperationFocus.RANDOM,
    numberRange: NumberRangeMode.RANDOM,
  }
): Question => {
  // Difficulty scales with score and difficulty setting
  let baseDifficulty = 0;
  let optionCount = 3;
  
  if (difficultySetting === Difficulty.EASY) {
    baseDifficulty = Math.min(Math.floor(score / 8), 5);
    optionCount = 3;
  } else if (difficultySetting === Difficulty.NORMAL) {
    baseDifficulty = Math.min(Math.floor(score / 5), 10);
    optionCount = 4;
  } else if (difficultySetting === Difficulty.HARD) {
    baseDifficulty = Math.min(Math.floor(score / 3) + 3, 15);
    optionCount = 5;
  } else if (difficultySetting === Difficulty.DEVIL) {
    baseDifficulty = Math.min(Math.floor(score / 2) + 6, 20);
    optionCount = 6;
  }

  const difficulty = baseDifficulty;
  const rangePreset = getRangePreset(difficulty, tuning.numberRange);
  const operations = getOperationPool(difficulty, difficultySetting, tuning);
  
  const operator = operations[Math.floor(Math.random() * operations.length)];
  
  let a = 0, b = 0, answer = 0;
  let text = '';

  // Generate numbers based on operator and difficulty
  switch (operator) {
    case '+':
      a = getRandomInt(Math.max(1, rangePreset.min || 1), Math.max(2, rangePreset.max));
      b = getRandomInt(Math.max(1, rangePreset.min || 1), Math.max(2, rangePreset.max));
      answer = a + b;
      text = `${a} + ${b} = ?`;
      break;
    case '-':
      a = getRandomInt(
        Math.max(5, tuning.numberRange === NumberRangeMode.ABOVE_50 ? 50 : 5),
        Math.max(10, rangePreset.max + (tuning.numberRange === NumberRangeMode.ABOVE_50 ? 20 : 5))
      );
      b = getRandomInt(
        tuning.numberRange === NumberRangeMode.ABOVE_50 ? 10 : 0,
        Math.max(tuning.numberRange === NumberRangeMode.ABOVE_50 ? 20 : 1, a - 1)
      );
      answer = a - b;
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
              : 5 + difficulty;
      const factorMin = tuning.numberRange === NumberRangeMode.ABOVE_50 ? 4 : 2;
      a = getRandomInt(factorMin, factorMax);
      b = getRandomInt(factorMin, factorMax);
      answer = a * b;
      if (tuning.numberRange === NumberRangeMode.ABOVE_50 && answer < 50) {
        answer = answer + 50;
        a = answer;
        b = 1;
      }
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
      answer =
        tuning.numberRange === NumberRangeMode.WITHIN_10
          ? getRandomInt(1, 10)
          : tuning.numberRange === NumberRangeMode.WITHIN_20
            ? getRandomInt(2, 20)
            : tuning.numberRange === NumberRangeMode.ABOVE_50
              ? getRandomInt(50, 100 + difficulty * 4)
              : getRandomInt(2, 8 + difficulty);
      a = answer * b;
      text = `${a} ÷ ${b} = ?`;
      break;
    }
  }

  // Generate wrong options that are close to the answer
  const options = new Set<number>();
  options.add(answer);

  while (options.size < optionCount) {
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
    const wrong = answer + (offset * direction);
    if (wrong >= 0) options.add(wrong);
  }

  // Convert Set to Array and shuffle
  const shuffledOptions = Array.from(options).sort(() => Math.random() - 0.5);

  return {
    text,
    answer,
    options: shuffledOptions
  };
};
