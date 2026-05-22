import assert from 'node:assert/strict';
import { Difficulty, GameTuning, NumberRangeMode, OperationFocus } from '../types';
import { generateQuestion, getMathDifficultyShape } from '../services/mathService';

const sampleScores = [0, 1, 4, 8, 16, 32, 64];
const tuningCases: Array<{ name: string; tuning: GameTuning }> = [
  {
    name: 'balanced random',
    tuning: {
      operationFocus: OperationFocus.RANDOM,
      numberRange: NumberRangeMode.RANDOM,
      allowRemainder: false,
      allowNegative: false,
    },
  },
  {
    name: 'quick 60 starter shape',
    tuning: {
      operationFocus: OperationFocus.RANDOM,
      numberRange: NumberRangeMode.WITHIN_20,
      allowRemainder: false,
      allowNegative: false,
    },
  },
  {
    name: 'addition and subtraction under 20',
    tuning: {
      operationFocus: OperationFocus.ADD_SUB,
      numberRange: NumberRangeMode.WITHIN_20,
      allowRemainder: false,
      allowNegative: false,
    },
  },
  {
    name: 'signed above 50',
    tuning: {
      operationFocus: OperationFocus.ADD_SUB,
      numberRange: NumberRangeMode.ABOVE_50,
      allowRemainder: false,
      allowNegative: true,
    },
  },
  {
    name: 'division with remainder',
    tuning: {
      operationFocus: OperationFocus.MUL_DIV,
      numberRange: NumberRangeMode.WITHIN_20,
      allowRemainder: true,
      allowNegative: false,
    },
  },
];

const expectedOptionCount: Record<Difficulty, number> = {
  [Difficulty.EASY]: 3,
  [Difficulty.NORMAL]: 4,
  [Difficulty.HARD]: 5,
  [Difficulty.DEVIL]: 5,
};

const parseInteger = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  assert.ok(Number.isFinite(parsed), `Expected integer answer, received ${value}`);
  return parsed;
};

const parseRemainder = (value: string): { quotient: number; remainder: number } => {
  const match = value.match(/^(\d+)……(\d+)$/);
  assert.ok(match, `Expected remainder answer, received ${value}`);
  return { quotient: Number(match[1]), remainder: Number(match[2]) };
};

const solveQuestionText = (text: string): string => {
  const mathMatch = text.match(/^(\d+) ([+\-×÷]) (\d+) = \?$/);
  assert.ok(mathMatch, `Question text did not match expected math format: ${text}`);

  const [, leftRaw, operator, rightRaw] = mathMatch;
  const left = Number(leftRaw);
  const right = Number(rightRaw);

  switch (operator) {
    case '+':
      return String(left + right);
    case '-':
      return String(left - right);
    case '×':
      return String(left * right);
    case '÷': {
      const quotient = Math.floor(left / right);
      const remainder = left % right;
      return remainder === 0 ? String(quotient) : `${quotient}……${remainder}`;
    }
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
};

const assertQuestionInvariants = (difficulty: Difficulty, score: number, tuning: GameTuning): void => {
  const question = generateQuestion(score, difficulty, tuning);
  const uniqueOptions = new Set(question.options);

  assert.equal(question.options.length, expectedOptionCount[difficulty], `${difficulty} should expose stable option count`);
  assert.equal(uniqueOptions.size, question.options.length, `Options must be unique for ${question.text}`);
  assert.ok(question.options.includes(question.answer), `Options must include answer for ${question.text}`);
  assert.equal(question.answer, solveQuestionText(question.text), `Answer must solve ${question.text}`);

  if (!tuning.allowNegative) {
    for (const option of question.options) {
      if (!option.includes('……')) {
        assert.ok(parseInteger(option) >= 0, `Negative option leaked without allowNegative: ${option}`);
      }
    }
  }

  if (question.text.includes('÷') && question.answer.includes('……')) {
    const divisor = Number(question.text.match(/÷ (\d+) = \?$/)?.[1]);
    const { remainder } = parseRemainder(question.answer);
    assert.ok(remainder > 0 && remainder < divisor, `Remainder must be between 1 and divisor-1 for ${question.text}`);
  }
};

for (const difficulty of Object.values(Difficulty)) {
  let previousBaseDifficulty = -1;

  for (const score of sampleScores) {
    const shape = getMathDifficultyShape(score, difficulty);
    assert.equal(shape.optionCount, expectedOptionCount[difficulty], `${difficulty} optionCount drifted`);
    assert.ok(shape.baseDifficulty >= previousBaseDifficulty, `${difficulty} baseDifficulty regressed at score ${score}`);
    previousBaseDifficulty = shape.baseDifficulty;

    for (const { name, tuning } of tuningCases) {
      for (let sample = 0; sample < 40; sample += 1) {
        assertQuestionInvariants(difficulty, score, tuning);
      }
      process.stdout.write(`✓ ${difficulty} score=${score} ${name}\n`);
    }
  }
}

console.log('Math question generation invariants passed.');
