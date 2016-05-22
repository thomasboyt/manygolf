import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {
  WIDTH,
  HEIGHT,
} from '../../universal/constants';

import {
  subscribe as runLoopSubscribe,
} from '../runLoop';

import scaleCanvas from '../util/scaleCanvas';

import render from '../render';

export default class Canvas extends React.Component<{}, {}> {
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
      this.renderCanvas(state);
    });
  }

  renderCanvas(state) {
    render(this._ctx, state);
  }

  render() {
    return (
      <canvas />
    );
  }
}