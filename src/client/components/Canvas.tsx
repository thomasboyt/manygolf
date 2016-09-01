import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
  WIDTH,
  HEIGHT,
} from '../../universal/constants';

import {
  subscribe as runLoopSubscribe,
} from '../runLoop';

import render from '../render';

interface Props {
  onClick: (scaledX: number, scaledY: number) => void;
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

interface CanvasState {
  scaleFactor: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  styleWidth: string;
  styleMaxHeight: string;
}

class Canvas extends React.Component<Props, CanvasState> {
  state: CanvasState = {
    scaleFactor: 1,
    width: null,
    height: null,
    canvasWidth: null,
    canvasHeight: null,
    styleWidth: null,
    styleMaxHeight: null,
  };

  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;

  componentDidMount() {
    this._canvas = (ReactDOM.findDOMNode(this) as HTMLCanvasElement);
    this._ctx = this._canvas.getContext('2d');

    // set up canvas
    this.handleResize();

    window.onresize = () => {
      this.handleResize();
    };

    runLoopSubscribe((state) => {
      render(this._ctx, state, this.state.scaleFactor);
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

    this.setState({
      scaleFactor: scale,
      width: WIDTH * scale,
      height: HEIGHT * scale,
      canvasWidth: WIDTH * scale * pixelRatio,
      canvasHeight: HEIGHT * scale * pixelRatio,
      styleWidth: `${WIDTH * scale}px`,
      styleMaxHeight: `${HEIGHT * scale}px`,
    });

    // TODO: do this elsewhere?
    setTimeout(() => {
      const ctx = this._canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(scale * pixelRatio, scale * pixelRatio);
    }, 0);
  }

  handleClick(e: React.MouseEvent) {
    const rect = ReactDOM.findDOMNode(this).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // scale
    const xScale = WIDTH / this.state.width;
    const yScale = HEIGHT / this.state.height;

    this.props.onClick(x * xScale, y * yScale);
  }

  render() {
    const style = {
      width: this.state.styleWidth,
      maxHeight: this.state.styleMaxHeight,
    };

    return (
      <canvas
        onClick={(e) => this.handleClick(e)}
        width={this.state.canvasWidth}
        height={this.state.canvasHeight}
        style={style} />
    );
  }
}

export default Canvas;