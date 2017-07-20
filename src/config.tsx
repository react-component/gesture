/* tslint:disable:no-bitwise */

// http://hammerjs.github.io/api/#directions
export const DIRECTION_NONE = 1;
export const DIRECTION_LEFT = 2;
export const DIRECTION_RIGHT = 4;
export const DIRECTION_UP = 8;
export const DIRECTION_DOWN = 16;

export const DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
export const DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
export const DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

// http://hammerjs.github.io/recognizer-tap/
export const TAP = {
  time: 250, // Maximum press time in ms.
  posThreshold: 10, // Maximum press time in ms.
};

// http://hammerjs.github.io/recognizer-press/
export const PRESS = {
  time: 251, // Minimal press time in ms.
  threshold: 9, // Minimal movement that is allowed while pressing.
};

// http://hammerjs.github.io/recognizer-swipe/
export const SWIPE = {
  threshold: 10,
  velocity: 0.3,
};
