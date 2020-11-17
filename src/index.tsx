/* tslint:disable:no-console */
import React, { Component, TouchEventHandler } from 'react';
import {
  calcRotation,
  getEventName, now,
  calcMultiFingerStatus, calcMoveStatus,
  shouldTriggerSwipe, shouldTriggerDirection,
  getMovingDirection, getDirectionEventName,
} from './util';
import { PRESS, DIRECTION_ALL, DIRECTION_VERTICAL, DIRECTION_HORIZONTAL } from './config';

export declare type GestureHandler = (s: IGestureStatus) => void;

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

  // control allowed direction
  direction?: 'all' | 'vertical' | 'horizontal';

  // pinch: s.zoom
  onPinch?: GestureHandler;
  onPinchStart?: GestureHandler;
  onPinchMove?: GestureHandler;
  onPinchEnd?: GestureHandler;
  onPinchCancel?: GestureHandler;
  onPinchIn?: GestureHandler;
  onPinchOut?: GestureHandler;

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
  onPanLeft?: GestureHandler;
  onPanRight?: GestureHandler;
  onPanUp?: GestureHandler;
  onPanDown?: GestureHandler;

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

  // original dom element event handler
  onTouchStart?: TouchEventHandler<HTMLElement>;
  onTouchMove?: TouchEventHandler<HTMLElement>;
  onTouchEnd?: TouchEventHandler<HTMLElement>;
  onTouchCancel?: TouchEventHandler<HTMLElement>;
};

// http://hammerjs.github.io/api/#event-object
export interface IGestureStatus {
  /* start status snapshot */
  startTime: number;
  startTouches: Finger[];

  startMultiFingerStatus?: MultiFingerStatus[];

  /* now status snapshot */
  time: number;
  touches: Finger[];
  preTouches: Finger[];

  multiFingerStatus?: MultiFingerStatus[];

  /* delta status from touchstart to now, just for singe finger */
  moveStatus?: SingeFingerMoveStatus;

  /* whether is a long tap */
  press?: boolean;

  /* whether is a pan */
  pan?: boolean;
  /* whether is an available pan */
  availablePan?: boolean;

  /* whether is a swipe*/
  swipe?: boolean;
  direction?: number;

  /* whether is in pinch process */
  pinch?: boolean;
  scale?: number;

  /* whether is in rotate process */
  rotate?: boolean;
  rotation?: number; // Rotation (in deg) that has been done when multi-touch. 0 on a single touch.

  /* event, such as TouchEvent, MouseEvent, PointerEvent */
  srcEvent: any;
};

const directionMap = {
  all: DIRECTION_ALL,
  vertical: DIRECTION_VERTICAL,
  horizontal: DIRECTION_HORIZONTAL,
};

export default class Gesture extends Component<IGesture, any> {
  static defaultProps = {
    enableRotate: false,
    enablePinch: false,
    direction: 'all',
  };

  state = {
  };

  protected gesture: IGestureStatus;

  protected event: any;

  private pressTimer: NodeJS.Timer;

  private directionSetting: number;

  constructor(props) {
    super(props);
    this.directionSetting = directionMap[props.direction];
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
    this.triggerSubEvent(mainEventName, eventStatus, ...args);

  }
  triggerSubEvent = (mainEventName, eventStatus, ...args) => {
    if (eventStatus) {
      const subEventName = getEventName(mainEventName, eventStatus);
      this.triggerEvent(subEventName, ...args);
    }
  }
  triggerPinchEvent = (mainEventName, eventStatus, ...args) => {
    const { scale } = this.gesture;
    if (eventStatus === 'move' && typeof scale === 'number') {
      if (scale > 1) {
        this.triggerEvent('onPinchOut');
      }
      if (scale < 1) {
        this.triggerEvent('onPinchIn');
      }
    }
    this.triggerCombineEvent(mainEventName, eventStatus, ...args);
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

    // cache the previous touches
    if (this.gesture.touches) {
      this.gesture.preTouches = this.gesture.touches;
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
    delete this.gesture;
  }
  getTouches = (e) => {
    return Array.prototype.slice.call(e.touches).map(item => ({
      x: item.screenX,
      y: item.screenY,
    }));
  }
  triggerUserCb = (status, e) => {
    const cbName = getEventName('onTouch', status);
    if (cbName in this.props) {
      this.props[cbName](e);
    }
  }
  _handleTouchStart = (e) => {
    this.triggerUserCb('start', e);
    this.event = e;
    if (e.touches.length > 1) {
      e.preventDefault();
    }
    this.initGestureStatus(e);
    this.initPressTimer();
    this.checkIfMultiTouchStart();
  }
  initGestureStatus = (e) => {
    this.cleanGestureState();
    // store the gesture start state
    const startTouches = this.getTouches(e);
    const startTime = now();
    const startMultiFingerStatus = calcMultiFingerStatus(startTouches);
    this.setGestureState({
      startTime,
      startTouches,
      startMultiFingerStatus,
      /* copy for next time touch move calc convenient*/
      time: startTime,
      touches: startTouches,
      multiFingerStatus: startMultiFingerStatus,
      srcEvent: this.event,
    });
  }

  checkIfMultiTouchStart = () => {
    const { enablePinch, enableRotate } = this.props;
    const { touches } = this.gesture;
    if (touches.length > 1 && (enablePinch || enableRotate)) {
      if (enablePinch) {
        const startMultiFingerStatus = calcMultiFingerStatus(touches);
        this.setGestureState({
          startMultiFingerStatus,

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
    this.triggerUserCb('move', e);
    this.event = e;
    if (!this.gesture) {
      // sometimes weird happen: touchstart -> touchmove..touchmove.. --> touchend --> touchmove --> touchend
      // so we need to skip the invalid event cycle after touchend
      return;
    }

    // not a long press
    this.cleanPressTimer();

    this.updateGestureStatus(e);
    this.checkIfSingleTouchMove();
    this.checkIfMultiTouchMove();
  }
  checkIfMultiTouchMove = () => {
    const { pinch, rotate, touches, startMultiFingerStatus, multiFingerStatus } = this.gesture as any;
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
      const scale = multiFingerStatus.z / startMultiFingerStatus.z;
      this.setGestureState({
        scale,
      });
      this.triggerPinchEvent('onPinch', 'move');
    }
    if (rotate) {
      const rotation = calcRotation(startMultiFingerStatus, multiFingerStatus);
      this.setGestureState({
        rotation,
      });
      this.triggerCombineEvent('onRotate', 'move');
    }
  }
  allowGesture = () => {
    return shouldTriggerDirection(this.gesture.direction, this.directionSetting);
  }
  checkIfSingleTouchMove = () => {
    const { pan, touches, moveStatus, preTouches, availablePan = true } = this.gesture;
    if (touches.length > 1) {
      this.setGestureState({
        pan: false,
      });
      // Todo: 1 finger -> 2 finger, wait to test this situation
      pan && this.triggerCombineEvent('onPan', 'cancel');
      return;
    }

    // add availablePan condition to fix the case in scrolling, which will cause unavailable pan move.
    if (moveStatus && availablePan) {
      const direction = getMovingDirection(preTouches[0], touches[0]);
      this.setGestureState({direction});

      const eventName = getDirectionEventName(direction);
      if (!this.allowGesture()) {
        // if the first move is unavailable, then judge all of remaining touch movings are also invalid.
        if (!pan) {
          this.setGestureState({availablePan: false});
        }
        return;
      }
      if (!pan) {
        this.triggerCombineEvent('onPan', 'start');
        this.setGestureState({
          pan: true,
          availablePan: true,
        });
      } else {
        this.triggerCombineEvent('onPan', eventName);
        this.triggerSubEvent('onPan', 'move');
      }
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
    let multiFingerStatus;
    if (pinch || rotate) {
      multiFingerStatus = calcMultiFingerStatus(touches);
    }

    this.setGestureState({
      /* update status snapshot */
      touches,
      multiFingerStatus,
      /* update duration status */
      moveStatus,

    });
  }
  _handleTouchEnd = (e) => {
    this.triggerUserCb('end', e);
    this.event = e;
    if (!this.gesture) {
      return;
    }
    this.cleanPressTimer();
    this.updateGestureStatus(e);
    this.doSingleTouchEnd('end');
    this.checkIfMultiTouchEnd('end');
  }

  _handleTouchCancel = (e) => {
    this.triggerUserCb('cancel', e);
    this.event = e;
    // Todo: wait to test cancel case
    if (!this.gesture) {
      return;
    }
    this.cleanPressTimer();
    this.updateGestureStatus(e);
    this.doSingleTouchEnd('cancel');
    this.checkIfMultiTouchEnd('cancel');
  }
  triggerAllowEvent = (type, status) => {
    if (this.allowGesture()) {
      this.triggerCombineEvent(type, status);
    } else {
      this.triggerSubEvent(type, status);
    }
  }
  doSingleTouchEnd = (status) => {
    const { moveStatus, pinch, rotate, press, pan, direction } = this.gesture;

    if (pinch || rotate) {
      return;
    }
    if (moveStatus) {
      const { z, velocity } = moveStatus;
      const swipe = shouldTriggerSwipe(z, velocity);
      this.setGestureState({
        swipe,
      });
      if (pan) {
        // pan need end, it's a process
        // sometimes, start with pan left, but end with pan right....
        this.triggerAllowEvent('onPan', status);
      }
      if (swipe) {
        const directionEvName = getDirectionEventName(direction);
        // swipe just need a direction, it's a endpoint
        this.triggerAllowEvent('onSwipe', directionEvName);
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
  getTouchAction = () => {
    const { enablePinch, enableRotate } = this.props;
    const { directionSetting } = this;
    if (enablePinch || enableRotate || directionSetting === DIRECTION_ALL) {
      return 'pan-x pan-y';
    }
    if (directionSetting === DIRECTION_VERTICAL) {
      return 'pan-x';
    }
    if (directionSetting === DIRECTION_HORIZONTAL) {
      return 'pan-y';
    }
    return 'auto';
  }
  render() {
    const { children } = this.props;

    const child = React.Children.only(children);
    const touchAction = this.getTouchAction();

    const events = {
      onTouchStart: this._handleTouchStart,
      onTouchMove: this._handleTouchMove,
      onTouchCancel: this._handleTouchCancel,
      onTouchEnd: this._handleTouchEnd,
    };

    return React.cloneElement(child, {
      ...events,
      style: {
        touchAction,
        ...(child.props.style || {}),
      },
    });
  }
}
