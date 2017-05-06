import * as React from 'react';

import ws from '../../ws';
import {messageSendChat} from '../../../universal/protocol';
import {Emoticon} from '../../../universal/constants';

import IconButton from './IconButton';

const happyUrl = require('../../../../assets/happy.png');
const sadUrl = require('../../../../assets/sad.png');
const chatUrl = require('../../../../assets/chat.png');
const closeUrl = require('../../../../assets/close.png');

import {
  ControlButton,
} from '../../buttons';

interface ChatControlState {
  chatOptsOpen: boolean;
}

export default class ChatControl extends React.Component<{}, ChatControlState> {
  state: ChatControlState = {
    chatOptsOpen: false,
  };

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
    const icon = this.state.chatOptsOpen ? closeUrl : chatUrl;

    return (
      <div className="chat-control-container">
        {this.state.chatOptsOpen ? this.renderChatOpts() : null}
        <IconButton icon={icon} onClick={() => this.handleClick()} />
      </div>
    );
  }
}
