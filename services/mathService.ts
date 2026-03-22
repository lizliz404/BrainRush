import { Question, Difficulty } from '../types';

export const generateQuestion = (score: number, difficultySetting: Difficulty = Difficulty.NORMAL): Question => {
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
  }

  const difficulty = baseDifficulty;
  
  const operations = ['+', '-'];
  if (difficulty > 3) operations.push('*');
  
  const operator = operations[Math.floor(Math.random() * operations.length)];
  
  let a = 0, b = 0, answer = 0;
  let text = '';

  // Generate numbers based on operator and difficulty
  switch (operator) {
    case '+':
      a = Math.floor(Math.random() * (10 + difficulty * 5)) + 1;
      b = Math.floor(Math.random() * (10 + difficulty * 5)) + 1;
      answer = a + b;
      text = `${a} + ${b} = ?`;
      break;
    case '-':
      a = Math.floor(Math.random() * (10 + difficulty * 5)) + 5;
      b = Math.floor(Math.random() * a); // Ensure positive result
      answer = a - b;
      text = `${a} - ${b} = ?`;
      break;
    case '*':
      a = Math.floor(Math.random() * (3 + difficulty)) + 2;
      b = Math.floor(Math.random() * (5 + difficulty)) + 1;
      answer = a * b;
      text = `${a} × ${b} = ?`;
      break;
  }

  // Generate wrong options that are close to the answer
  const options = new Set<number>();
  options.add(answer);

  while (options.size < optionCount) {
    const offset = Math.floor(Math.random() * 5) + 1;
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