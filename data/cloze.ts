import { ClozeItem } from '../types';

export const CLOZE_SET: ClozeItem[] = [
  {
    sentence: 'I go to school by ____ every day.',
    answer: 'bus',
    zhHint: '公交车',
    distractors: ['car', 'bike', 'train', 'plane', 'boat'],
  },
  {
    sentence: 'Please ____ the door before you leave.',
    answer: 'close',
    zhHint: '关闭',
    distractors: ['open', 'lock', 'break', 'clean', 'paint'],
  },
  {
    sentence: 'The weather is cold. Put on your ____.',
    answer: 'jacket',
    zhHint: '夹克',
    distractors: ['gloves', 'shoes', 'hat', 'pants', 'socks'],
  },
  {
    sentence: 'She is very ____ because she passed the exam.',
    answer: 'happy',
    zhHint: '开心的',
    distractors: ['sad', 'angry', 'tired', 'bored', 'nervous'],
  },
  {
    sentence: 'We need to buy fresh ____ from the market.',
    answer: 'vegetables',
    zhHint: '蔬菜',
    distractors: ['books', 'chairs', 'toys', 'phones', 'shoes'],
  },
  {
    sentence: 'He is good at ____ basketball.',
    answer: 'playing',
    zhHint: '打（球）',
    distractors: ['drawing', 'reading', 'watching', 'buying', 'making'],
  },
  {
    sentence: 'My sister likes reading story ____.',
    answer: 'books',
    zhHint: '故事书（复数）',
    distractors: ['games', 'songs', 'letters', 'maps', 'cards'],
  },
  {
    sentence: 'We have lunch at twelve ____.',
    answer: 'oclock',
    zhHint: '点钟',
    distractors: ['minutes', 'meters', 'years', 'classes', 'tables'],
  },
];
