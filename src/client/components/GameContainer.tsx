import * as React from 'react';
import isTouch from '../util/isTouch';

import ControlBar from './ControlBar';
import Canvas from './Canvas';
import Overlay from './Overlay';

import {Store} from 'redux';
import {State} from '../records';
import {Subscriber} from '../runLoop';

export default class GameContainer extends React.Component<{}, {}> {
  maybeRenderMobileHelp() {
    if (isTouch) {
      return (
        <p class="orientation-help-text mobile-only">
          (turn your phone sideways for a better view!)
        </p>
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className="game-container">
        <Canvas />
        <ControlBar />

        <div style={{clear: 'both'}} />

        {this.maybeRenderMobileHelp()}
      </div>
    );
  }
}