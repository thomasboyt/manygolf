import * as React from 'react';

import isTouch from '../util/isTouch';

const leftArrowUrl = require('../../../assets/left.png');
const rightArrowUrl = require('../../../assets/right.png');
const shootUrl = require('../../../assets/shoot.png');
const happyUrl = require('../../../assets/happy.png');
const sadUrl = require('../../../assets/sad.png');

import ws from '../ws';
import {messageSendChat} from '../../universal/protocol';
import {Emoticon} from '../../universal/constants';

export enum ControlButton {
  LeftArrow,
  RightArrow,
  Shoot,
  ChatHappy,
  ChatSad,
}

// TODO: Put this in a reducer or something
export const buttonsDown = new Set<ControlButton>();

interface ControlProps {
  type: ControlButton;
  className: string;
  icon: string;
}

class GameControl extends React.Component<ControlProps, {}> {
  handleTouchStart(e) {
    e.preventDefault();
    buttonsDown.add(this.props.type);
  }

  handleTouchEnd(e) {
    e.preventDefault();
    buttonsDown.delete(this.props.type);
  }

  render() {
    const {type, icon, className} = this.props;

    return (
      <img src={icon} className={className}
        onTouchStart={(e) => this.handleTouchStart(e)}
        onTouchEnd={(e) => this.handleTouchEnd(e)}
        onMouseDown={(e) => this.handleTouchStart(e)}
        onMouseUp={(e) => this.handleTouchEnd(e)} />
    );
  }
}

class ChatControl extends React.Component<{}, {}> {
  state = {
    chatOptsOpen: false,
  }

  handleClick() {
    this.setState({
      chatOptsOpen: !this.state.chatOptsOpen,
    });
  }

  handleClickChatIcon(button: ControlButton) {
    if (button === ControlButton.ChatHappy) {
      ws.send(messageSendChat({
        emoticon: Emoticon.happy,
      }));

    } else if (button === ControlButton.ChatSad) {
      ws.send(messageSendChat({
        emoticon: Emoticon.sad,
      }));
    }

    this.setState({
      chatOptsOpen: false,
    });
  }

  renderChatOpts() {
    const style = {
      display: 'flex',
      background: '#444',
      position: 'absolute',
      zIndex: '2',
      bottom: '100%',
      marginLeft: '-50%',
      marginBottom: '10px',
      padding: '5px',
      borderRadius: '10px',
      opacity: 0.7,
    };

    return (
      <div style={style}>
        <img src={happyUrl} onClick={() => this.handleClickChatIcon(ControlButton.ChatHappy)} />
        <img src={sadUrl} onClick={() => this.handleClickChatIcon(ControlButton.ChatSad)} />
      </div>
    );
  }

  render() {
    return (
      <div style={{position: 'relative'}}>
        {this.state.chatOptsOpen ? this.renderChatOpts() : null}
        <img src={happyUrl} onClick={() => this.handleClick()} />
      </div>
    );
  }
}

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
    let controls;

    if (isTouch) {
      controls = this.renderTouchControls();
    } else {
      controls = this.renderDesktopControls();
    }

    return (
      <div className="control-bar">
        {controls}
      </div>
    );
  }
}
