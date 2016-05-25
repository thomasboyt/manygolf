import * as React from 'react';
import isTouch from '../util/isTouch';

import ControlBar from './ControlBar';
import Canvas from './Canvas';

import {Store} from 'redux';
import {State} from '../records';
import {Subscriber} from '../runLoop';

interface Props {
  standalone?: boolean;
}

export default class GameContainer extends React.Component<Props, {}> {
  maybeRenderMobileHelp() {
    if (isTouch) {
      return (
        <p className="orientation-help-text mobile-only">
          (turn your phone sideways for a better view!)
        </p>
      );
    } else {
      return null;
    }
  }

  render() {
    const className = this.props.standalone ? 'game-container standalone' : 'game-container';

    return (
      <div className={className}>
        <Canvas />
        <ControlBar />

        <div style={{clear: 'both'}} />

        {this.maybeRenderMobileHelp()}
      </div>
    );
  }
}