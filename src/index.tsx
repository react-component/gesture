/* tslint:disable:no-console */
import React, { Component } from 'react';
import {
  calcLenFromTouch, calcRotation,
  getEventName, now,
  calcTriangleDistance, calcSwipeAngle,
  shouldTriggerSwipe, shouldTriggerDoubleTap,
  getDirection, getDirectionEventName,
} from './util';
import { PRESS } from './config';

export interface IGesture {
  // config options
  enableRotate?: boolean;
  enablePinch?: boolean;

  // pinch: s.zoom
  onPinchStart?: (s: IGestureStauts, e: object) => {};
  onPinchMove?: (s: IGestureStauts, e: object) => {};
  onPinchEnd?: (s: IGestureStauts, e: object) => {};

  // rotate: s.angle
  onRotateStart?: (s: IGestureStauts, e: object) => {};
  onRotateMove?: (s: IGestureStauts, e: object) => {};
  onRotateEnd?: (s: IGestureStauts, e: object) => {};

  // pan: s.delta
  onPanStart?: (s: IGestureStauts, e: object) => {};
  onPanMove?: (s: IGestureStauts, e: object) => {};
  onPanEnd?: (s: IGestureStauts, e: object) => {};

  // tap
  onTap?: (s: IGestureStauts, e: object) => {};

  // double tap
  onDoubleTap?: (s: IGestureStauts, e: object) => {};

  // long tap
  onPress?: (s: IGestureStauts, e: object) => {};
  onPressUp?: (s: IGestureStauts, e: object) => {};

  // swipe
  onSwipe?: (s: IGestureStauts, e: object) => {};
  onSwipeLeft?: (s: IGestureStauts, e: object) => {};
  onSwipeRight?: (s: IGestureStauts, e: object) => {};
  onSwipeUp?: (s: IGestureStauts, e: object) => {};
  onSwipeDown?: (s: IGestureStauts, e: object) => {};

}

// http://hammerjs.github.io/api/#event-object
export interface IGestureStauts {
    /* start status */
    startTime: number;
    startX: number;
    startY: number;

    /* touch status snapshot */
    time: number;
    x: number;
    y: number;

    /* Total time and offset since touchStart */
    deltaTime?: number; // in ms
    deltaX?: number;
    deltaY?: number;
    delta?: number;
    velocity?: number;

    /* whether is a double tap */
    doubleTap?: boolean;

    /* whether is a long tap */
    press?: boolean;

    /* whether is a swipe*/
    swipe?: boolean;

    /* pinch status */
    pinchStartLen?: number;
    pinchStartLenX?: number;
    pinchStartLenY?: number;
    pinchLen?: number;
    pinchLenX?: number;
    pinchLenY?: number;
    scale?: number;

    /* swipe status */
    angle?: number; // Angle moved.

    /* rotate status */
    rotation?: number; // Rotation (in deg) that has been done when multi-touch. 0 on a single touch.

}

export default class Gesture extends Component<IGesture, any> {
  static defaultProps = {
    enableRotate: false,
    enablePinch: false,
  };

  state = {
  };

  protected gesture: IGestureStauts;
  protected _prevTapSnaoshot: Partial<IGestureStauts>;

  private pressTimer: number;
  private cleanGestureTimer: number;

  constructor(props) {
    super(props);
  }

  callEvent = (name, ...args) => {
    const cb = this.props[name];
    if (typeof cb === 'function') {
      // always give user gesture object as first params first
      cb(this.getGestureState(), ...args);
    }
  }

  updateGestureStatus = (e) => {
    const { startTime, startX, startY } = this.gesture;
    const { pageX, pageY } = e.touches[0];
    const nowTime = now();
    const deltaTime = nowTime - startTime;
    const deltaX = pageX - startX;
    const deltaY = pageY - startY;
    const delta = calcTriangleDistance(deltaX, deltaY);
    const velocity = delta / deltaTime;

    this.setGestureState({
      /* update status snapshot */
      time: nowTime,
      x: pageX,
      y: pageY,
      /* update duration status */
      deltaTime,
      deltaX,
      deltaY,
      delta,
      velocity,
    });
  }
  startPressTimer = (e) => {
    this.cancerPressTimer();
    this.pressTimer = setTimeout(() => {
      this.setGestureState({
        press: true,
      });
      this.callEvent('onPress', e);
    }, PRESS.time);
  }
  cancerPressTimer = () => {
    /* tslint:disable:no-unused-expression */
    this.pressTimer && clearTimeout(this.pressTimer);
  }
  setGestureState = (params) => {
    if (!this.gesture) {
      this.gesture = {} as any;
    }
    this.gesture = {
      ...this.gesture,
      ...params,
    };
  }
  getGestureState = () => {
    if (!this.gesture) {
      return this.gesture;
    } else {
      // shallow copy
      return {
        ...this.gesture,
      };
    }
  }
  cleanGestureState = () => {
    this.cleanGestureTimer = setTimeout(() => {
      console.log('clean gesture state');
      delete this.gesture;
    }, 0);
  }
  fixWrongTick = () => {
    // this happend in ios, when you double click, why ?
    this.cleanGestureTimer && clearTimeout(this.cleanGestureTimer);
    delete this.gesture;
  }
  initGestureStatus = (e) => {
    this.fixWrongTick();
    // store the gesture state
    const { pageX, pageY } = e.touches[0];
    const nowTime = now();
    this.setGestureState({
      /* start status */
      startTime: nowTime,
      startX: pageX,
      startY: pageY,
      /* init prev status snapshot*/
      time: nowTime,
      x: pageX,
      y: pageY,
    });
  }
  doDoubleTap = () => {
    if (this._prevTapSnaoshot) {
      // check if double click
      const { startTime, startX, startY } = this._prevTapSnaoshot as any;
      const { time, x , y } = this.gesture;
      const doubleTap = shouldTriggerDoubleTap(time - startTime, x - startX, y - startY);
      this.setGestureState({
        doubleTap,
      });
    }
  }
  _handleTouchStart = (e) => {
    console.log('touchstart', e.touches);
    // in case touchmove just trigger once
    e.preventDefault();
    e.persist();

    this.initGestureStatus(e);

    this.doDoubleTap();

    this.startMultiTouch(e);

    this.startPressTimer(e);
  }

  _handleTouchMove = (e) => {
    console.log('touchmove', e.touches);
    e.persist();

    // not a long press
    this.cancerPressTimer();

    // not a double click
    this.setGestureState({
      doubleTap: false,
    });
    this.updateGestureStatus(e);
    this.doMultiTouch(e, 'move');
  }

  _handleTouchEnd = (e) => {
    console.log('touchend', e.touches);
    this.cancerPressTimer();
    this.doMultiTouch(e, 'end');
    this.doTapOrSwipe(e);
    this.cleanGestureState();
  }

  _handleTouchCancel = (e) => {
    // only if no touchMove, touchEnd, and prevent default, propgation in touchStart
    console.log('touchcancel', e.touches);
    this.cancerPressTimer();
    this.updateGestureStatus(e);
    this.doMultiTouch(e, 'cancel');
    this.cleanGestureState();
  }
  startMultiTouch = (e) => {
    const { enablePinch, enableRotate } = this.props;
    if (e.touches.length > 1 && (enablePinch || enableRotate)) {
      if (enablePinch) {
        const { x: pinchStartLenX, y: pinchStartLenY, z: pinchStartLen } = calcLenFromTouch(e.touches);
        this.setGestureState({
          pinchStartLenX,
          pinchStartLenY,
          pinchStartLen,
        });
        this.callEvent('onPinchStart', e);
      }
      if (enableRotate) {
        this.setGestureState({
          rotation: 0,
        });
        this.callEvent('onRotateStart', e);
      }
    }
  }
  doMultiTouch = (e, status) => {
    const { enablePinch, enableRotate } = this.props;
    const { pinchStartLen, pinchStartLenX, pinchStartLenY } = this.gesture as any;
    if (e.touches.length > 1 && (enablePinch || enableRotate)) {
      const { x: pinchLenX, y: pinchLenY, z: pinchLen } = calcLenFromTouch(e.touches);
      this.setGestureState({
        pinchLen,
        pinchLenX,
        pinchLenY,
      });
      if (enablePinch) {
        const scale = pinchLen / pinchStartLen;
        this.setGestureState({
          scale,
        });
        this.callEvent(getEventName('onPinch', status), e);
      }
      if (enableRotate) {
        const rotation = calcRotation({
          x: pinchLenX,
          y: pinchLenY,
          z: pinchLen,
        }, {
          x: pinchStartLenX,
          y: pinchStartLenY,
          z: pinchStartLen,
        });
        this.setGestureState({
          rotation,
        });
        this.callEvent(getEventName('onRotate', status), e);
      }
    }
  }
  doTapOrSwipe = e => {
    const { velocity, delta, doubleTap, press, startTime, startX, startY, deltaX, deltaY } = this.gesture;
    const swipe = shouldTriggerSwipe(delta, velocity);
    const direction = getDirection(deltaX, deltaY);
    this.setGestureState({
      swipe,
      direction,
    });
    if (swipe) {
      this.doSwipe(e);
    } else {
      if (doubleTap) {
        this.callEvent('onDoubleTap', e);
        delete this._prevTapSnaoshot;
      } else if (press) {
        this.callEvent('onPressUp', e);
      } else {
        this.callEvent('onTap', e);
        this._prevTapSnaoshot = {
          startTime,
          startX,
          startY,
        };
      }
    }
  }

  doSwipe = (e) => {
    const { deltaX, deltaY } = this.gesture as any;
    const angle = calcSwipeAngle(deltaX, deltaY);
    const direction = getDirection(deltaX, deltaY);
    const eventName = getDirectionEventName(direction);
    this.setGestureState({
      angle,
      direction,
    });
    this.callEvent('onSwipe', e);
    this.callEvent(eventName, e);
  }
  componentWillUnmount() {
    this.cancerPressTimer();
  }
  render() {
    const { children } = this.props;

    const child = React.Children.only(children);

    const events = {
      onTouchStart: this._handleTouchStart,
      onTouchMove: this._handleTouchMove,
      onTouchCancel: this._handleTouchCancel,
      onTouchEnd: this._handleTouchEnd,
    };

    return React.cloneElement(child, events);
  }
}
