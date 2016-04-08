// inspired, like many bits of code, by coquette.js:
// https://github.com/maryrosecook/coquette/blob/master/src/inputter.js

import keyCodes from './keyCodes';

export const keysDown = new Set<number>();

const interruptKeyCodes = new Set([
  keyCodes.LEFT_ARROW,
  keyCodes.RIGHT_ARROW,
  keyCodes.UP_ARROW,
  keyCodes.DOWN_ARROW,
  keyCodes.SPACE,
]);

export function registerListeners() {
  window.addEventListener('keydown', (e) => {
    keysDown.add(e.keyCode);

    if (interruptKeyCodes.has(e.keyCode)) {
      e.preventDefault();
      return false;
    }
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.keyCode);
  });
}
