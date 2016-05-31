import * as React from 'react';
import TwitterLink from './TwitterLink';
import mobileBridge from '../mobileBridge';

interface Props {
  onRequestClose: () => void;
}

class InfoScreen extends React.Component<Props, {}> {
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
      <div className="info-screen">
        <h1>Manygolf</h1>

        <div className="info-cols-container">
          <div className="info-col">
            <p>
              manygolf is a massively multiplayer golf game. everyone plays together, simultaneously,
              in the same session.
            </p>
            <p>
              whoever wins the round in the fewest number of strokes wins. in the event of a tie, the player
              who scores the fastest wins.
            </p>
          </div>
          <div className="info-col">
            <h2>share</h2>
            <p>
              feeling lonely? find some people to play with by pressing this fancy social media integration button! it has a marketing hashtag and everything
            </p>
            <p>
              {mobileBridge.isNative() ? this.renderNativeShare() : <TwitterLink />}
            </p>
          </div>
        </div>

        <p onClick={() => this.props.onRequestClose()}>
          tap here to close
        </p>
      </div>
    );
  }
}

export default InfoScreen;