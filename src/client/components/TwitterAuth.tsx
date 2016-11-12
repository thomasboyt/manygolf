import * as React from 'react';
import {connect} from 'react-redux';

import {getHttpApiUrl} from '../api';

interface Props {
  twitterName: string;
}

class TwitterAuth extends React.Component<Props, {}> {
  handleTwitterAuth() {
    window.open(
      `${getHttpApiUrl()}/twitter-sign-in`,
      'TwitterSignIn',
      'resizable,scrolbars,status,width=500,height=400'
    );
  }

  render() {
    const {twitterName} = this.props;

    if (!twitterName) {
      return (
        <p>
          <a onClick={this.handleTwitterAuth}>Sign in with Twitter</a>
        </p>
      );

    } else {
      return (
        <p>
          connected to twitter as <span className="twitter-name">@{twitterName}</span>
        </p>
      )
    }
  }
}

function select(state) {
  return {
    twitterName: state.twitterName,
  };
}

export default connect(select)(TwitterAuth);
