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

declare type GestureHandler = (s: IGestureStauts) => void;

export interface IGesture {
  // config options
  enableRotate?: boolean;
  enablePinch?: boolean;

  // pinch: s.zoom
  onPinch?: GestureHandler;
  onPinchStart?: GestureHandler;
  onPinchMove?: GestureHandler;
  onPinchEnd?: GestureHandler;
  onPinchCancel?: GestureHandler;

  // rotate: s.angle
  onRotate?: GestureHandler;
  onRotateStart?: GestureHandler;
  onRotateMove?: GestureHandler;
  onRotateEnd?: GestureHandler;
  onRotateCancel?: GestureHandler;

  // pan: s.delta
  onPan?: GestureHandler;
  onPanStart?: GestureHandler;
  onPanMove?: GestureHandler;
  onPanEnd?: GestureHandler;
  onPanCancel?: GestureHandler;

  // tap
  onTap?: GestureHandler;

  // double tap
  onDoubleTap?: GestureHandler;

  // long tap
  onPress?: GestureHandler;
  onPressUp?: GestureHandler;

  // swipe
  onSwipe?: GestureHandler;
  onSwipeLeft?: GestureHandler;
  onSwipeRight?: GestureHandler;
  onSwipeUp?: GestureHandler;
  onSwipeDown?: GestureHandler;

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

    /* whether is in pinch process */
    pinch?: boolean;

    /* whether is in rotate process */
    rotate?: boolean;

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
  callCombineEvent = (mainEventName, eventStatus, ...args) => {
    this.callEvent(mainEventName, ...args);
    if (eventStatus) {
      const subEventName = getEventName(mainEventName, eventStatus);
      this.callEvent(subEventName, ...args);
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
      this.callEvent('onPress');
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
    console.log('clean gesture state');
    delete this.gesture;
  }

  initGestureStatus = (e) => {
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
    console.log('touchstart');
    // in case touchmove just trigger once
    e.preventDefault();

    this.initGestureStatus(e);

    this.doDoubleTap();

    this.startMultiTouch(e);

    this.startPressTimer(e);
  }

  _handleTouchMove = (e) => {
    console.log('touchmove');
    if (!this.gesture) {
      // sometimes: touchstart -> touchmove.... --> touchend --> touchmove --> touchend
      // so we need to skip the unnormal event cycle after touchend
      return;
    }

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
    console.log('touchend');
    if (!this.gesture) {
      return;
    }
    this.cancerPressTimer();
    this.doMultiTouch(e, 'end');
    this.doTapOrSwipe(e);
    this.cleanGestureState();
  }

  _handleTouchCancel = (e) => {
    // only if no touchMove, touchEnd, and prevent default, propgation in touchStart
    console.log('touchcancel');
    if (!this.gesture) {
      return;
    }
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
          pinch: true,
          pinchLen: pinchStartLen,
          pinchStartLenX,
          pinchStartLenY,
          pinchStartLen,
          scale: 1,
        });
        this.callCombineEvent('onPinch', 'start');
      }
      if (enableRotate) {
        this.setGestureState({
          rotate: true,
          rotation: 0,
        });
        this.callCombineEvent('onRotate', 'start');
      }
    }
  }
  doMultiTouch = (e, status) => {
    const { enablePinch, enableRotate } = this.props;
    const { pinchStartLen, pinchStartLenX, pinchStartLenY, pinch, rotate } = this.gesture as any;
    if (enablePinch || enableRotate) {
      if (e.touches.length > 1) {
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
          this.callCombineEvent('onPinch', status);
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
          this.callCombineEvent('onRotate', status);
        }
      }
      if (status === 'end') {
        if (pinch) {
          this.callCombineEvent('onPinch', status);
        }
        if (rotate) {
          this.callCombineEvent('onRotate', status);
        }
      }
    }
  }
  doTapOrSwipe = e => {
    const { velocity, delta, doubleTap, press, startTime,
      startX, startY, deltaX, deltaY, pinch, rotate,
    } = this.gesture;
    if (pinch || rotate) {
      return;
    }
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
    this.callCombineEvent('onSwipe', eventName);
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
