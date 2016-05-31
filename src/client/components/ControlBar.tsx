import * as React from 'react';

import isTouch from '../util/isTouch';

const leftArrowUrl = require('../../../assets/arrowLeft.png');
const rightArrowUrl = require('../../../assets/arrowRight.png');
const shootUrl = require('../../../assets/target.png');
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

interface ControlButtonProps extends React.HTMLProps<HTMLButtonElement> {
  icon: string;
}

class IconButton extends React.Component<ControlButtonProps, {}> {
  render() {
    const className = this.props.className || '';

    const innerStyle = {
      background: `url("${this.props.icon}") center no-repeat`,
      backgroundSize: '50px 50px',
      display: 'block',
      width: '100%',
      height: '100%',
    };

    return (
      <button {...this.props} className={`control-button ${className}`}>
        <span style={innerStyle} />
      </button>
    )
  }
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
    const {icon, className} = this.props;

    return (
      <IconButton className={className}
        icon={icon}
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
    return (
      <div className="chat-popup">
        <IconButton icon={happyUrl}
          onClick={() => this.handleClickChatIcon(ControlButton.ChatHappy)} />
        <IconButton icon={sadUrl}
          onClick={() => this.handleClickChatIcon(ControlButton.ChatSad)} />
      </div>
    );
  }

  render() {
    return (
      <div className="chat-control-container">
        {this.state.chatOptsOpen ? this.renderChatOpts() : null}
        <IconButton icon={happyUrl} onClick={() => this.handleClick()} />
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
