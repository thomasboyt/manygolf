import {sample} from 'lodash';

const adjectives = [
  'green',
  'rough',
  'iron',
  'angry',
  'sad',
  'happy',
  'sleepy',
  'amazing',
  'super',
  'boring',
  'unpleasant',
  'grumpy',
  'great',
  'ok',
  'mediocre',
  'explosive',
  'incredible',
  'extreme',
  'dull',
  'ace',
];

const nouns = [
  'birdie',
  'eagle',
  'bogey',
  'albatross',
  'caddie',
  'backspin',
  'bunker',
  'hook',
  'iron',
  'mulligan',
  'putt',
  'tee',
  'green',
  'fairway',
  'club',
  'wedge',
  'rough',
  'swing',
  'golf',
  'major',
  'slice',
  'spin',
  'hazard',
  'draw',
  'fade',
  'ball',
  'ace',
];

function capitalize(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

export default function nameGen(): string {
  const adj = sample(adjectives);
  const noun = sample(nouns);
  return `${capitalize(adj)} ${capitalize(noun)}`;
}
