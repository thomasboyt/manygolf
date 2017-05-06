import * as React from 'react';
import mobileBridge from '../../mobileBridge';
import TwitterLink from '../TwitterLink';

class ShareScreen extends React.Component<{}, {}> {
  handleNativeShare(e: React.MouseEvent) {
    mobileBridge.displayNativeShare();
    e.preventDefault();
  }

  renderNativeShare() {
    return (
      <a href="#" onClick={this.handleNativeShare}>share</a>
    );
  }

  render() {
    return (
      <div>
        <h2>share</h2>
        <p>
          feeling lonely? find some people to play with by pressing this fancy social media integration button! it has a marketing hashtag and everything
        </p>
        <p>
          {mobileBridge.isNative() ? this.renderNativeShare() : <TwitterLink />}
        </p>
      </div>
    );
  }
}

export default ShareScreen;