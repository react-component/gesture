import { TAP, SWIPE, DIRECTION_NONE, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP, DIRECTION_DOWN } from './config';

export interface ITriange {
  x: number;
  y: number;
  z: number; // z = x * x + y * y;
}

export function now() {
  return Date.now();
}

export function calcTriangleDistance(x, y) {
  return Math.sqrt(x * x + y * y);
}
function calcDistanceFromPoint(x1, y1, x2, y2) {
  const x = x2 - x1;
  const y = y2 - y1;
  return {
    x,
    y,
    z: calcTriangleDistance(x, y),
  };
}

export function calcLenFromTouch(touches) {
  return calcDistanceFromPoint(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY);
}

export function calcRotation(start: ITriange, now: ITriange) {
  const { x: startX, y: startY, z: startZ } = start;
  const { x, y, z } = now;
  if (startZ === 0 || z === 0) {
    return 0;
  }
  // https://en.wikipedia.org/wiki/Dot_product
  let cosine = (startX * x + startY * y) / startZ * z;
  if (cosine > 1) {
    cosine = 1;
  }
  return Math.acos(cosine);
}

export function getEventName(prefix, status) {
  return prefix + status[0].toUpperCase() + status.slice(1);
}

export function isInTapDelay(deltaTime) {
  return deltaTime > 0 && deltaTime <= TAP.time;
}

export function isInTapArea(deltaX, deltaY) {
  return Math.abs(deltaX) < TAP.posThreshold && Math.abs(deltaY) < TAP.posThreshold;
}

export function shouldTriggerDoubleTap(deltaTime, deltaX, deltaY) {
  return isInTapDelay(deltaTime) && isInTapArea(deltaX, deltaY);
}

export function shouldTriggerSwipe(delta, velocity) {
  return Math.abs(delta) >= SWIPE.threshold && Math.abs(velocity) > SWIPE.velocity;
}

export function calcSwipeAngle (x, y) {
  const radian = Math.atan2(y, x);
  return 180 / (Math.PI / radian);
}

/**
 * @private
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
export function getDirection(x, y) {
  if (x === y) {
    return DIRECTION_NONE;
  }

  if (Math.abs(x) >= Math.abs(y)) {
    return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
  }
  return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

export function getDirectionEventName(direction) {
  let name;
  switch (direction) {
    case DIRECTION_NONE:
      break;
    case DIRECTION_LEFT:
      name = 'onSwipeLeft';
      break;
    case DIRECTION_RIGHT:
      name = 'onSwipeRight';
      break;
    case DIRECTION_UP:
      name = 'onSwipeUp';
      break;
    case DIRECTION_DOWN:
      name = 'onSwipeDown';
      break;
    default:
  }
  return name;
}
