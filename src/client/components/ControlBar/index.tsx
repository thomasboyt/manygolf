import * as React from 'react';
import {connect} from 'react-redux';

import {ControlButton} from '../../buttons';
import isTouch from '../../util/isTouch';
import {State} from '../../records';
import {GameState} from '../../../universal/constants';

import GameControl from './GameControl';
import ChatControl from './ChatControl';
import MenuControl from './MenuControl';

const leftArrowUrl = require('../../../../assets/arrowLeft.png');
const rightArrowUrl = require('../../../../assets/arrowRight.png');
const shootUrl = require('../../../../assets/target.png');

interface Props {
  gameState: GameState;
}

class ControlBar extends React.Component<Props, {}> {
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
      <MenuControl key="menu" />,
    ];
  }

  render() {
    if (this.props.gameState !== GameState.roundInProgress) {
      return null;
    }

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

function select(state: State) {
  return {
    gameState: state.gameState,
  };
}

export default connect(select)(ControlBar);