import React from 'react';
import classNames from 'classnames';

import PlayerScreen from './PlayerScreen';
import HelpScreen from './HelpScreen';
import ShareScreen from './ShareScreen';

interface Props {
  onRequestClose: () => void;
}

interface State {
  activeTabIndex: number;
}

class InfoScreen extends React.Component<Props, State> {
  state: State = {
    activeTabIndex: 0,
  };

  renderTabs(labels: string[]) {
    return labels.map((label, idx) => {
      return (
        <li key={idx}>
          <a onClick={() => this.setState({activeTabIndex: idx})}>
            {label}
          </a>
        </li>
      );
    });
  }

  renderTabContent(idx: number, content: React.ReactElement<any>) {
    const className = classNames('info-tab', {
      active: idx === this.state.activeTabIndex,
    });

    return (
      <div className={className} key={idx}>
        {content}
      </div>
    );
  }

  renderContent(tabs: React.ReactElement<any>[]) {
    return tabs.map((content, idx) => this.renderTabContent(idx, content));
  }

  render() {
    const tabs = [
      {
        label: 'Account',
        content: <PlayerScreen />,
      },
      {
        label: 'Share',
        content: <ShareScreen />,
      },
      {
        label: 'About',
        content: <HelpScreen />,
      },
    ];

    return (
      <div className="info-modal-container">
        <div className="info-modal">
          <h1>Manygolf</h1>

          <ul className="info-tabs">
            {this.renderTabs(tabs.map((tab) => tab.label))}
          </ul>

          <div className="info-content-container">
            {this.renderContent(tabs.map((tab) => tab.content))}
          </div>

          <p onClick={() => this.props.onRequestClose()}>
            tap here to close
          </p>
        </div>
      </div>
    );
  }
}

export default InfoScreen;