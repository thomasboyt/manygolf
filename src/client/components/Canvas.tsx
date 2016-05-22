import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {connect} from 'react-redux';

import {
  WIDTH,
  HEIGHT,
  ConnectionState
} from '../../universal/constants';

import {
  subscribe as runLoopSubscribe,
} from '../runLoop';

import scaleCanvas from '../util/scaleCanvas';

import render from '../render';

interface Props {
  connectionState: ConnectionState;
}

class Canvas extends React.Component<Props, {}> {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  componentDidMount() {
    this._canvas = (ReactDOM.findDOMNode(this) as HTMLCanvasElement);
    this._ctx = this._canvas.getContext('2d');

    // set up canvas
    scaleCanvas(this._canvas, WIDTH, HEIGHT);

    window.onresize = () => {
      scaleCanvas(this._canvas, WIDTH, HEIGHT);
    };

    runLoopSubscribe((state) => {
      render(this._ctx, state);
    });
  }

  handleClick() {
    if (this.props.connectionState === ConnectionState.disconnected) {
      document.location.reload();
    }
  }

  render() {
    return (
      <canvas onClick={() => this.handleClick()} />
    );
  }
}

function select(state) {
  return {
    connectionState: state.connectionState
  };
}

export default connect(select)(Canvas);