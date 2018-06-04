/* tslint:disable:no-console no-unused-expression */

import Gesture from 'rc-gesture';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
const style = `
  .outter {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px auto;
    width: 80%;
    height: 40px;
    border-width: 1px;
    border-color: red;
    border-style: solid;
    overflow: hidden;
  }
  .inner {
    width: 80%;
    height: 80%;
    background-color: black;
  }
  .swiper-container{
    margin: 20px 0;
  }
  .swiper{
    display: flex;
    align-items: center;
    text-align: center;
    background-color: #CCC;
    width: 100%;
    height: 100%;
  }
`;

class Demo extends Component<any, any> {
  private root: any;
  private rootNode: any;
  private _scale: number;
  private _rotation: number;
  private _x: number;
  private _y: number;

  constructor(props) {
    super(props);
  }
  log = (type: string, keys?: string[]) => (...args) => {
    window.requestAnimationFrame(() => {
      this.doLog(type, keys, ...args);
      this.doTransform(type, ...args);
    });
  }
  doLog = (type, keys, ...args) => {
    const extInfo = keys ? keys.map(key => `${key} = ${args[0][key]}`).join(', ') : '';
    const logEl = this.refs.log as any;
    logEl.innerHTML += `<p>${type} ${extInfo}</p>`;
    logEl.scrollTop = logEl.scrollHeight;
  }
  doTransform = (type, ...args) => {
    if (type === 'onPinch') {
      const { scale } = args[0];
      this._scale = scale;
    }
    if (type === 'onRotate') {
      const { rotation }  = args[0];
      this._rotation = rotation;
    }
    if (type === 'onPan') {
      const { x, y } = args[0].moveStatus;
      this._x = x;
      this._y = y;
    }
    if (type === 'onPanEnd' || type === 'onPanCancel') {
      const { x, y } = args[0].moveStatus;
      this._x = 0;
      this._y = 0;
    }
    let transform: any = [];
    this._scale && transform.push(`scale(${this._scale})`);
    this._rotation && transform.push(`rotate(${this._rotation}deg)`);
    typeof this._x === 'number' && transform.push(`translateX(${this._x}px)`);
    typeof this._y === 'number' && transform.push(`translateY(${this._y}px)`);
    transform = transform.join(' ');
    this.rootNode = ReactDOM.findDOMNode(this.root);
    this.rootNode.style.transform = transform;
  }
  moveSwiper(e) {
    const {srcEvent, moveStatus} = e;
    const {x, y} = e.moveStatus;

    this.swiperNode = ReactDOM.findDOMNode(this.refSwiper);
    this.swiperNode.style.transform = [`translateX(${x}px)`];

    // preventDefault, avoid trigger scroll event when touch moving.
    srcEvent.preventDefault();
  }

  resetSwiper() {
    this.swiperNode = ReactDOM.findDOMNode(this.refSwiper);
    this.swiperNode.style.transform = [`translateX(0px)`];
  }

  render() {
    return (
      <div>
        <style dangerouslySetInnerHTML={{__html: style}}/>
        <div ref="log" style={{height: 100, overflow: 'auto', margin: 10}}/>
        <div className="outter">
          <Gesture
            direction="all"
            enablePinch
            enableRotate
            onTap={this.log('onTap')}
            onPress={this.log('onPress')}
            onPressUp={this.log('onPressUp')}
            onSwipe={this.log('onSwipe', ['direction'])}
            onSwipeLeft = {this.log('onSwipeLeft', ['direction'])}
            onSwipeRight = {this.log('onSwipeRight', ['direction'])}
            onSwipeUp = {this.log('onSwipeUp', ['direction'])}
            onSwipeDown = {this.log('onSwipeDown', ['direction'])}
            onPinch={this.log('onPinch', ['scale'])}
            onPinchStart={this.log('onPinchStart', ['scale'])}
            onPinchMove={this.log('onPinchMove', ['scale'])}
            onPinchEnd={this.log('onPinchEnd', ['scale'])}
            onPinchCancel={this.log('onPinchCancel', ['scale'])}
            onPinchIn={this.log('onPinchIn', ['scale'])}
            onPinchOut={this.log('onPinchOut', ['scale'])}
            onRotate={this.log('onRotate', ['rotation'])}
            onRotateStart={this.log('onRotateStart', ['rotation'])}
            onRotateMove={this.log('onRotateMove', ['rotation'])}
            onRotateEnd={this.log('onRotateEnd', ['rotation'])}
            onRotateCancel={this.log('onRotateCancel', ['rotation'])}
            onPan={this.log('onPan', ['moveStatus', 'direction'])}
            onPanStart={this.log('onPanStart', ['moveStatus', 'direction'])}
            onPanMove={this.log('onPanMove', ['moveStatus', 'direction'])}
            onPanEnd={this.log('onPanEnd', ['moveStatus', 'direction'])}
            onPanCancel={this.log('onPanCancel', ['moveStatus', 'direction'])}
            onPanLeft={this.log('onPanLeft', ['moveStatus', 'direction'])}
            onPanRight={this.log('onPanRight', ['moveStatus', 'direction'])}
            onPanUp={this.log('onPanUp', ['moveStatus', 'direction'])}
            onPanDown={this.log('onPanDown', ['moveStatus', 'direction'])}
          >
            <div className="inner" ref={(el) => { this.root = el; }}>
            </div>
          </Gesture>
        </div>
        <div className="swiper-container">
          <Gesture
            direction="horizontal"
            onPanMove={ (e, args) => { this.moveSwiper(e, args); } }
            onPanEnd={ () => { this.resetSwiper(); } }
          >
            <div style={{height: 200, backgroundColor: 'red'}}>
              <div className="swiper" ref={ (e) => { this.refSwiper = e; } }>
              This is simple swiper demo. Only allow horizontal direction and height=200px to test scroll event.
              </div>
            </div>
          </Gesture>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Demo />, document.getElementById('__react-content'));
