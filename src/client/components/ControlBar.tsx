import * as React from 'react';

import isTouch from '../util/isTouch';

const leftArrowUrl = require('../../../assets/left.png');
const rightArrowUrl = require('../../../assets/right.png');
const shootUrl = require('../../../assets/shoot.png');
const happyUrl = require('../../../assets/happy.png');
const sadUrl = require('../../../assets/sad.png');

export enum ControlButton {
  LeftArrow,
  RightArrow,
  Shoot,
  ChatHappy,
  ChatSad,
}

// TODO: Put this in a reducer or something
export const buttonsDown = new Set<ControlButton>();

interface Control {
  type: ControlButton;
  className: string;
  icon: string;
}

const touchControls: Control[] = [{
  type: ControlButton.LeftArrow,
  className: 'left-arrow',
  icon: leftArrowUrl,
}, {
  type: ControlButton.RightArrow,
  className: 'right-arrow',
  icon: rightArrowUrl,
}, {
  type: ControlButton.ChatHappy,
  className: 'emoticon happy',
  icon: happyUrl,
}, {
  type: ControlButton.ChatSad,
  className: 'emoticon sad',
  icon: sadUrl,
}, {
  type: ControlButton.Shoot,
  className: 'shoot',
  icon: shootUrl,
}];

const desktopControls: Control[] = [{
  type: ControlButton.ChatHappy,
  className: 'emoticon happy',
  icon: happyUrl,
}, {
  type: ControlButton.ChatSad,
  className: 'emoticon sad',
  icon: sadUrl,
}];

export default class ControlBar extends React.Component<{}, {}> {
  renderControl(control: Control) {
    const {type, icon, className} = control;

    const handleTouchStart = (e) => {
      e.preventDefault();
      buttonsDown.add(type);
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      buttonsDown.delete(type);
    };

    return (
      <img src={icon} className={className} onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd} onMouseDown={handleTouchStart} onMouseUp={handleTouchEnd}
        key={type} />
    );
  }

  render() {
    let controls;

    if (isTouch) {
      controls = touchControls;
    } else {
      controls = desktopControls;
    }

    return (
      <div className="control-bar">
        {controls.map(this.renderControl)}
      </div>
    )
  }
}
