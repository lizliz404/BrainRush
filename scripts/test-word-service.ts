import assert from 'node:assert/strict';
import { Difficulty, WordDirectionMode, WordTuning } from '../types';
import { generateWordQuestionWithTuning } from '../services/wordService';
import { VOCAB_META } from '../data/vocabMeta';

const expectedOptionCount: Record<Difficulty, number> = {
  [Difficulty.EASY]: 3,
  [Difficulty.NORMAL]: 4,
  [Difficulty.HARD]: 5,
  [Difficulty.DEVIL]: 5,
};

const tuningCases: Array<{ name: string; tuning: WordTuning }> = [
  { name: 'mixed', tuning: { allowCloze: true, directionMode: WordDirectionMode.MIXED } },
  { name: 'en to zh', tuning: { allowCloze: false, directionMode: WordDirectionMode.EN_TO_ZH } },
  { name: 'zh to en', tuning: { allowCloze: false, directionMode: WordDirectionMode.ZH_TO_EN } },
];

const hasChinese = (value: string): boolean => /[\u4e00-\u9fff]/.test(value);
const hasAsciiLetter = (value: string): boolean => /[a-z]/i.test(value);
const isCleanText = (value: string): boolean => !/[`/[\]\\]|\bp\.\s*\d+\b|\[[^\]]+\]|\.{3,}|…|—/.test(value);

assert.ok(Object.keys(VOCAB_META).length > 1500, 'Expected pep-words enrichment metadata to be available');

for (const difficulty of Object.values(Difficulty)) {
  for (const { name, tuning } of tuningCases) {
    for (let sample = 0; sample < 120; sample += 1) {
      const question = generateWordQuestionWithTuning(difficulty, tuning);
      const uniqueOptions = new Set(question.options);

      assert.equal(question.options.length, expectedOptionCount[difficulty], `${difficulty}/${name} option count drifted`);
      assert.equal(uniqueOptions.size, question.options.length, `${difficulty}/${name} options must be unique for ${question.text}`);
      assert.ok(question.options.includes(question.answer), `${difficulty}/${name} options must include answer for ${question.text}`);
      assert.ok(question.text.trim().length > 0, `${difficulty}/${name} question text must not be blank`);
      assert.ok(question.answer.trim().length > 0, `${difficulty}/${name} answer must not be blank`);
      assert.ok(question.text.length <= 24, `${difficulty}/${name} question text is too long: ${question.text}`);
      assert.ok(question.options.every(option => hasChinese(option) ? option.length <= 18 : option.length <= 22), `${difficulty}/${name} option is too long for ${question.text}: ${question.options.join(' | ')}`);
      assert.ok(isCleanText(question.text), `${difficulty}/${name} question text contains source noise: ${question.text}`);
      assert.ok(question.options.every(isCleanText), `${difficulty}/${name} option contains source noise for ${question.text}: ${question.options.join(' | ')}`);

      if (tuning.directionMode === WordDirectionMode.EN_TO_ZH) {
        assert.ok(hasAsciiLetter(question.text), `${difficulty}/${name} prompt should be English: ${question.text}`);
        assert.ok(question.options.every(hasChinese), `${difficulty}/${name} options should be Chinese: ${question.options.join(' | ')}`);
      }

      if (tuning.directionMode === WordDirectionMode.ZH_TO_EN) {
        assert.ok(hasChinese(question.text), `${difficulty}/${name} prompt should be Chinese: ${question.text}`);
        assert.ok(question.options.every(hasAsciiLetter), `${difficulty}/${name} options should be English: ${question.options.join(' | ')}`);
      }
    }
    process.stdout.write(`✓ ${difficulty} ${name}\n`);
  }
}

console.log('Word question generation invariants passed.');
