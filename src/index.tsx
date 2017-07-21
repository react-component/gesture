/* tslint:disable:no-console */
import React, { Component } from 'react';
import {
  calcRotation,
  getEventName, now,
  calcMutliFingerStatus, calcMoveStatus,
  shouldTriggerSwipe,
  getDirection, getDirectionEventName,
} from './util';
import { PRESS } from './config';

export declare type GestureHandler = (s: IGestureStauts) => void;

export declare type Finger = {
  x: number; // e.touches[i].pageX
  y: number; // e.touches[i].pageY
};

export declare type MultiFingerStatus = {
  x: number;
  y: number;
  z: number;
  angle: number;
};

export declare type SingeFingerMoveStatus = {
  x: number;
  y: number;
  z: number;
  time: number;
  velocity: number;
  angle: number;
};

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

  // long tap
  onPress?: GestureHandler;
  onPressUp?: GestureHandler;

  // swipe
  onSwipe?: GestureHandler;
  onSwipeLeft?: GestureHandler;
  onSwipeRight?: GestureHandler;
  onSwipeUp?: GestureHandler;
  onSwipeDown?: GestureHandler;
};

// http://hammerjs.github.io/api/#event-object
export interface IGestureStauts {
    /* start status snapshot */
    startTime: number;
    startTouches: Finger[];

    startMutliFingerStatus?: MultiFingerStatus[];

    /* now status snapshot */
    time: number;
    touches: Finger[];

    mutliFingerStatus?: MultiFingerStatus[];

    /* delta status from touchstart to now, just for singe finger */
    moveStatus?: SingeFingerMoveStatus;

    /* whether is a long tap */
    press?: boolean;

    /* whether is a swipe*/
    swipe?: boolean;
    direction?: number;

    /* whether is in pinch process */
    pinch?: boolean;
    scale?: number;

    /* whether is in rotate process */
    rotate?: boolean;
    rotation?: number; // Rotation (in deg) that has been done when multi-touch. 0 on a single touch.
};

export default class Gesture extends Component<IGesture, any> {
  static defaultProps = {
    enableRotate: false,
    enablePinch: false,
  };

  state = {
  };

  protected gesture: IGestureStauts;

  private pressTimer: number;

  constructor(props) {
    super(props);
  }

  triggerEvent = (name, ...args) => {
    const cb = this.props[name];
    if (typeof cb === 'function') {
      // always give user gesture object as first params first
      cb(this.getGestureState(), ...args);
    }
  }
  triggerCombineEvent = (mainEventName, eventStatus, ...args) => {
    this.triggerEvent(mainEventName, ...args);
    if (eventStatus) {
      const subEventName = getEventName(mainEventName, eventStatus);
      this.triggerEvent(subEventName, ...args);
    }
  }
  initPressTimer = () => {
    this.cleanPressTimer();
    this.pressTimer = setTimeout(() => {
      this.setGestureState({
        press: true,
      });
      this.triggerEvent('onPress');
    }, PRESS.time);
  }
  cleanPressTimer = () => {
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
    console.log('clean pre gesture state');
    delete this.gesture;
  }
  getTouches = (e) => {
    return Array.prototype.slice.call(e.touches).map(item => ({
      x: item.pageX,
      y: item.pageY,
    }));
  }

  _handleTouchStart = (e) => {
    console.log('touchstart');

    e.preventDefault();
    this.initGestureStatus(e);
    this.initPressTimer();
    this.checkIfMultiTouchStart();
  }
  initGestureStatus = (e) => {
    this.cleanGestureState();
    // store the gesture start state
    const startTouches = this.getTouches(e);
    const startTime = now();
    const startMutliFingerStatus = calcMutliFingerStatus(startTouches);
    this.setGestureState({
      startTime,
      startTouches,
      startMutliFingerStatus,
      /* copy for next time touch move cala convenient*/
      time: startTime,
      touches: startTouches,
      mutliFingerStatus: startMutliFingerStatus,
    });
  }

  checkIfMultiTouchStart = () => {
    const { enablePinch, enableRotate } = this.props;
    const { touches } = this.gesture;
    if (touches.length > 1 && (enablePinch || enableRotate)) {
      if (enablePinch) {
        const startMutliFingerStatus = calcMutliFingerStatus(touches);
        this.setGestureState({
         startMutliFingerStatus,

         /* init pinch status */
         pinch: true,
         scale: 1,
        });
        this.triggerCombineEvent('onPinch', 'start');
      }
      if (enableRotate) {
        this.setGestureState({
          /* init rotate status */
          rotate: true,
          rotation: 0,
        });
        this.triggerCombineEvent('onRotate', 'start');
      }
    }
  }
  _handleTouchMove = (e) => {
    console.log('touchmove');
    if (!this.gesture) {
      // sometimes weird happen: touchstart -> touchmove..touchmove.. --> touchend --> touchmove --> touchend
      // so we need to skip the unnormal event cycle after touchend
      return;
    }

    // not a long press
    this.cleanPressTimer();

    this.updateGestureStatus(e);
    this.checkIfMultiTouchMove();
  }
  checkIfMultiTouchMove = () => {
    const { pinch, rotate, touches, startMutliFingerStatus, mutliFingerStatus } = this.gesture as any;
    if (!pinch && !rotate) {
      return;
    }
    if (touches.length < 2) {
      this.setGestureState({
        pinch: false,
        rotate: false,
      });
      // Todo: 2 finger -> 1 finger, wait to test this situation
      pinch && this.triggerCombineEvent('onPinch', 'cancel');
      rotate && this.triggerCombineEvent('onRotate', 'cancel');
      return;
    }

    if (pinch) {
      const scale = mutliFingerStatus.z / startMutliFingerStatus.z;
      this.setGestureState({
        scale,
      });
      this.triggerCombineEvent('onPinch', 'move');
    }
    if (rotate) {
      const rotation = calcRotation(startMutliFingerStatus, mutliFingerStatus);
      this.setGestureState({
        rotation,
      });
      this.triggerCombineEvent('onRotate', 'move');
    }
  }
  checkIfMultiTouchEnd = (status) => {
    const { pinch, rotate } = this.gesture;
    if (pinch) {
      this.triggerCombineEvent('onPinch', status);
    }
    if (rotate) {
      this.triggerCombineEvent('onRotate', status);
    }
  }
  updateGestureStatus = (e) => {
    const time = now();
    this.setGestureState({
      time,
    });
    if (!e.touches || !e.touches.length) {
      return;
    }
    const { startTime, startTouches, pinch, rotate } = this.gesture;
    const touches = this.getTouches(e);
    const moveStatus = calcMoveStatus(startTouches, touches, time - startTime);
    let mutliFingerStatus;
    if (pinch || rotate) {
      mutliFingerStatus = calcMutliFingerStatus(touches);
    }

    this.setGestureState({
      /* update status snapshot */
      touches,
      mutliFingerStatus,
      /* update duration status */
      moveStatus,

    });
  }
  _handleTouchEnd = (e) => {
    console.log('touchend');
    if (!this.gesture) {
      return;
    }
    this.cleanPressTimer();
    this.updateGestureStatus(e);
    this.checkIfMultiTouchEnd('end');
    this.checkIfEndWithTapOrSwipe();
  }

  _handleTouchCancel = (e) => {
    // Todo: wait to test cancel case
    console.log('touchcancel');
    if (!this.gesture) {
      return;
    }
    this.cleanPressTimer();
    this.updateGestureStatus(e);
    this.checkIfMultiTouchEnd('cancel');
  }

  checkIfEndWithTapOrSwipe = () => {
    const { moveStatus, pinch, rotate, press } = this.gesture;

    if (pinch || rotate) {
      return;
    }
    if (moveStatus) {
      const { x, y, z, velocity } = moveStatus;
      const swipe = shouldTriggerSwipe(z, velocity);
      const direction = getDirection(x, y);
      this.setGestureState({
        swipe,
        direction,
      });
      if (swipe) {
        const eventName = getDirectionEventName(direction);
        this.triggerCombineEvent('onSwipe', eventName);
        return;
      }
    }

    if (press) {
      this.triggerEvent('onPressUp');
      return;
    }
    this.triggerEvent('onTap');

  }

  componentWillUnmount() {
    this.cleanPressTimer();
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
