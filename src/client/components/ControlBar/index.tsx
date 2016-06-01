import React from 'react';

import {ControlButton} from '../../buttons';
import isTouch from '../../util/isTouch';

import GameControl from './GameControl';
import ChatControl from './ChatControl';

const leftArrowUrl = require('../../../../assets/arrowLeft.png');
const rightArrowUrl = require('../../../../assets/arrowRight.png');
const shootUrl = require('../../../../assets/target.png');

export default class ControlBar extends React.Component<{}, {}> {
  renderTouchControls() {
    return [
      <GameControl type={ControlButton.LeftArrow} className="left-arrow"
        icon={leftArrowUrl} key={ControlButton.LeftArrow} />,
      <GameControl type={ControlButton.RightArrow} className="right-arrow"
        icon={rightArrowUrl} key={ControlButton.RightArrow} />,

      <ChatControl key="chat" />,

      <GameControl type={ControlButton.Shoot} className="shoot"
        icon={shootUrl} key={ControlButton.Shoot} />,
    ];
  }

  renderDesktopControls() {
    return [
      <ChatControl key="chat" />,
    ];
  }

  render() {
    let controls, className;

    if (isTouch) {
      controls = this.renderTouchControls();
      className = 'touch';
    } else {
      controls = this.renderDesktopControls();
      className = 'desktop';
    }

    return (
      <div className={`control-bar ${className}`}>
        {controls}
      </div>
    );
  }
}
