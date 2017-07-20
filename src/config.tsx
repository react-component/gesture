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
