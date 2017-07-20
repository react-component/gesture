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
  log = type => (...args) => {
    console.log(type, ...args);
    this.refs.log.innerHTML += `<p>${type}: ${Date.now()}</p>`;
    this.refs.log.scrollTop = this.refs.log.scrollHeight;
  }
  render() {
    return (
      <div>
        <style dangerouslySetInnerHTML={{__html: style}}/>
        <div ref="log" style={{height: 100, overflow: 'auto', margin: 10}}/>
        <div className="outter">
          <Gesture
            onTap={this.log('onTap')}
            onPress={this.log('onPress')}
            onPressUp={this.log('onPressUp')}
            onSwipe={this.log('onSwipe')}
            onDoubleTap={this.log('onDoubleTap')}
            onPanStart={this.log('onPanStart')}
          >
            <div className="inner">
            </div>
          </Gesture>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Demo />, document.getElementById('__react-content'));
