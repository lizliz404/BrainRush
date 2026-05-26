import { ANSWER_BLOCK_RANGES, pickAnswerBlockCount } from '../services/feelTuningService';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const sequenceRandom = (values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length];
};

assert(pickAnswerBlockCount('low', sequenceRandom([0, 0.5, 0.999])) === 2, 'low block load must always start at 2');
assert(pickAnswerBlockCount('low', sequenceRandom([0.999])) === 2, 'low block load must always end at 2');

assert(pickAnswerBlockCount('normal', sequenceRandom([0])) === 2, 'normal block load min should be 2');
assert(pickAnswerBlockCount('normal', sequenceRandom([0.34])) === 3, 'normal block load middle should allow 3');
assert(pickAnswerBlockCount('normal', sequenceRandom([0.999])) === 4, 'normal block load max should be 4');

assert(pickAnswerBlockCount('high', sequenceRandom([0])) === 3, 'high block load min should be 3');
assert(pickAnswerBlockCount('high', sequenceRandom([0.34])) === 4, 'high block load middle should allow 4');
assert(pickAnswerBlockCount('high', sequenceRandom([0.999])) === 5, 'high block load max should be 5');

Object.entries(ANSWER_BLOCK_RANGES).forEach(([load, [min, max]]) => {
  assert(min >= 2, `${load} should never drop below 2 answer blocks`);
  assert(max >= min, `${load} range should be ordered`);
});

console.log('Feel tuning block range invariants passed.');
