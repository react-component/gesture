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
  constructor(props) {
    super(props);
  }
  log = (type, keys) => (...args) => {
    console.log(type, ...args);
    const extInfo = keys ? keys.map(key => `${key} = ${args[0][key]}`).join(', ') : '';
    this.refs.log.innerHTML += `<p>${type}: ${extInfo}</p>`;
    this.refs.log.scrollTop = this.refs.log.scrollHeight;
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
            onTap={this.log('onTap')}
            onPress={this.log('onPress')}
            onDoubleTap={this.log('onDoubleTap')}
            onPressUp={this.log('onPressUp')}
            onSwipe={this.log('onSwipe', ['angle', 'direction'])}
            onSwipeLeft = {this.log('onSwipeLeft', ['angle', 'direction'])}
            onSwipeRight = {this.log('onSwipeRight', ['angle', 'direction'])}
            onSwipeUp = {this.log('onSwipeUp', ['angle', 'direction'])}
            onSwipeDown = {this.log('onSwipeDown', ['angle', 'direction'])}
            onSwipeCancel = {this.log('onSwipeCancel', ['angle', 'direction'])}
            onPan={this.log('onPan')}
            onPanStart={this.log('onPanStart')}
            onPinch={this.log('onPinch', ['pinchLen', 'scale'])}
            onPinchStart={this.log('onPinchStart', ['pinchLen', 'scale'])}
            onPinchMove={this.log('onPinchMove', ['pinchLen', 'scale'])}
            onPinchEnd={this.log('onPinchEnd', ['pinchLen', 'scale'])}
            onPinchCancel={this.log('onPinchCancel', ['pinchLen', 'scale'])}
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
