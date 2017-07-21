/* tslint:disable:no-console no-unused-expression */

import Gesture from '../src/index';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
const style = `
  .outter {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px auto;
    width: 80%;
    height: 400px;
    border-width: 1px;
    border-color: red;
    border-style: solid;
  }
  .inner {
    width: 80%;
    height: 80%;
    background-color: black;
  }
`;

class Demo extends Component<any, any> {
  private root: any;
  private rootNode: any;
  private _scale: number;
  private _rotation: number;

  constructor(props) {
    super(props);
  }

  log = (type: string, keys?: string[]) => (...args) => {
    console.log(type, ...args);
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
    let transform: any = [];
    this._scale && transform.push(`scale(${this._scale})`);
    this._rotation && transform.push(`rotate(${this._rotation}deg)`);

    transform = transform.join(' ');
    this.rootNode = ReactDOM.findDOMNode(this.root);
    this.rootNode.style.transform = transform;
  }

  render() {
    return (
      <div>
        <style dangerouslySetInnerHTML={{__html: style}}/>
        <div ref="log" style={{height: 100, overflow: 'auto', margin: 10}}/>
        <div className="outter">
          <Gesture
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
            onRotate={this.log('onRotate', ['rotation'])}
            onRotateStart={this.log('onRotateStart', ['rotation'])}
            onRotateMove={this.log('onRotateMove', ['rotation'])}
            onRotateEnd={this.log('onRotateEnd', ['rotation'])}
            onRotateCancel={this.log('onRotateCancel', ['rotation'])}
          >
            <div className="inner" ref={(el) => { this.root = el; }}>
            </div>
          </Gesture>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Demo />, document.getElementById('__react-content'));
