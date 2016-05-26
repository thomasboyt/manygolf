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

function getScaleFactor(originalWidth: number, originalHeight: number, maxWidth: number,
                        maxHeight: number): number {
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    return 1;
  }

  const heightScale = maxHeight / originalHeight;
  const widthScale = maxWidth / originalWidth;
  return Math.min(heightScale, widthScale);
}

class Canvas extends React.Component<Props, {}> {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  state = {
    canvasWidth: null,
    canvasHeight: null,
    styleWidth: null,
    styleMaxHeight: null,
  }

  componentDidMount() {
    this._canvas = (ReactDOM.findDOMNode(this) as HTMLCanvasElement);
    this._ctx = this._canvas.getContext('2d');

    // set up canvas
    this.handleResize();

    window.onresize = () => {
      this.handleResize();
    };

    runLoopSubscribe((state) => {
      render(this._ctx, state);
    });
  }

  handleResize() {
    const parent = ReactDOM.findDOMNode(this).parentNode as HTMLElement;
    const parentWidth = parent.clientWidth;

    const viewportHeight = document.documentElement.clientHeight;

    const scale = getScaleFactor(WIDTH, HEIGHT, parentWidth, viewportHeight);

    let pixelRatio = 1;

    if (window.devicePixelRatio) {
      pixelRatio = window.devicePixelRatio;
    }

    // canvas width and height should be the pixel-scaled size
    this.setState({
      canvasWidth: WIDTH * scale * pixelRatio,
      canvasHeight: HEIGHT * scale * pixelRatio,
      styleWidth: `${WIDTH * scale}px`,
      styleMaxHeight: `${HEIGHT * scale}px`,
    });

    // canvas.width = width * scale * pixelRatio;
    // canvas.height = height * scale * pixelRatio;

    // TODO: do this elsewhere?
    setTimeout(() => {
      this._canvas.getContext('2d').scale(scale * pixelRatio, scale * pixelRatio);
    }, 0);
  }

  handleClick() {
    if (this.props.connectionState === ConnectionState.disconnected) {
      document.location.reload();
    }
  }

  render() {
    const style ={
      width: this.state.styleWidth,
      maxHeight: this.state.styleMaxHeight,
    };

    return (
      <canvas
        onClick={() => this.handleClick()}
        width={this.state.canvasWidth}
        height={this.state.canvasHeight}
        style={style} />
    );
  }
}

function select(state) {
  return {
    connectionState: state.connectionState
  };
}

export default connect(select)(Canvas);