import * as React from 'react';

import {getHttpApiUrl} from '../../api';

class PlayerScreen extends React.Component<{}, {}> {
  handleTwitterAuth() {
    window.open(
      `${getHttpApiUrl()}/twitter-sign-in`,
      'TwitterSignIn',
      'resizable,scrolbars,status,width=500,height=400'
    );
  }

  render() {
    return (
      <div>
        <h2>account</h2>
        <p>
          you are <strong>Cool Golf #1234</strong>
        </p>

        <p>
          <a onClick={this.handleTwitterAuth}>Sign in with Twitter</a>
        </p>
      </div>
    );
  }
}

export default PlayerScreen;