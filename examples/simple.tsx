/* tslint:disable:no-console */

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

  constructor(props) {
    super(props);
  }

  log = (type: string, keys?: string[]) => (...args) => {
    console.log(type, ...args);
    const extInfo = keys ? keys.map(key => `${key} = ${args[0][key]}`).join(', ') : '';
    const logEl = this.refs.log as any;
    logEl.innerHTML += `<p>${type} ${extInfo}</p>`;
    logEl.scrollTop = logEl.scrollHeight;
    if (type === 'onPinch') {
      const { scale } = args[0];
      this.rootNode = ReactDOM.findDOMNode(this.root);
      this.rootNode.style.transform = `scale(${scale})`;
    }
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
            onSwipe={this.log('onSwipe', ['angle', 'direction'])}
            onSwipeLeft = {this.log('onSwipeLeft', ['angle', 'direction'])}
            onSwipeRight = {this.log('onSwipeRight', ['angle', 'direction'])}
            onSwipeUp = {this.log('onSwipeUp', ['angle', 'direction'])}
            onSwipeDown = {this.log('onSwipeDown', ['angle', 'direction'])}
            onPan={this.log('onPan')}
            onPanStart={this.log('onPanStart')}
            onPinch={this.log('onPinch', ['pinchLen', 'scale'])}
            onPinchStart={this.log('onPinchStart', ['pinchLen', 'scale'])}
            onPinchMove={this.log('onPinchMove', ['pinchLen', 'scale'])}
            onPinchEnd={this.log('onPinchEnd', ['pinchLen', 'scale'])}
            onPinchCancel={this.log('onPinchCancel', ['pinchLen', 'scale'])}
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
