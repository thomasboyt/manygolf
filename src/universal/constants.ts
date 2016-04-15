export const WIDTH = 500;
export const HEIGHT = 250;

export const HOLE_HEIGHT = 10;
export const HOLE_WIDTH = 10;
export const BALL_RADIUS = 2.5;

export const MIN_POWER = 10;
export const MAX_POWER = 100;
export const SWING_STEP = 75;

export const TIMER_MS = 45 * 1000;
export const OVER_TIMER_MS = 5 * 1000;
export const HURRY_UP_MS = 10 * 1000;

export enum AimDirection {
  left,
  right,
}

export enum RoundState {
  inProgress,
  over,
};

export enum ConnectionState {
  connecting,
  connected,
  disconnected,
}

// thx friends
export const goalWords = [
  'touchdown',
  'nothing but net',
  'gooooooooal',
  'it\'s good',
  'you dunked',
  'nice dunk',
  'mmmmmonster dunk',
  'home run',
  'you defeated',
  'point get',         // gnu order
  'perfect score',     // gnu order
  'goat bonus',        // robiben
  'you\'re great',     // gnu order
  'your winner',       // robiben
  'ball bonus',        // robiben
  'perfect putt',      // gnu order
  'big gulp',          // robiben
  'nice one, senpai',  // cat doter
  'a winner is you',   // AlucardRD
  'come putt, milord', // cat doter
  '30 - love',         // oatgan
];
