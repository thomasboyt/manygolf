import * as React from 'react';
import isTouch from '../util/isTouch';

import {Store} from 'redux';
import {State} from '../records';
import {Subscriber} from '../runLoop';

import TwitterLink from './TwitterLink';
import GameContainer from './GameContainer';

const headerImage = require('../../../assets/header.png');

export default class Main extends React.Component<{}, {}> {
  maybeRenderControls() {
    if (isTouch) {
      return null;
    } else {
      return (
        <div>
          <h2>controls</h2>
          <p>
            A/D or left/right to set angle<br/>
            hold space to shoot
          </p>
        </div>
      );
    }
  }

  maybeRenderMobileHelp() {
    if (isTouch) {
      return (
        <p className="orientation-help-text">
          (turn your phone sideways for a better view!)
        </p>
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div>
        <div className="container">
          <header>
            <img src={headerImage} alt="Manygolf" />
          </header>

          <GameContainer />
          {this.maybeRenderMobileHelp()}
        </div>

        <div className="instructions">

          <div className="row">
            <div className="section">
              <h2>what</h2>
              <p>
                manygolf is a massively multiplayer golf game. everyone plays together, simultaneously,
                in the same session.
              </p>
              <p>
                whoever wins the round in the fewest number of strokes wins. in the event of a tie, the player
                who scores the fastest wins.
              </p>
            </div>

            <div className="section">
              {this.maybeRenderControls()}

              <h2>share</h2>
              <p>
                feeling lonely? find some people to play with by pressing this fancy social media integration button! it has a marketing hashtag and everything
              </p>
              <p>
                <TwitterLink />
              </p>
            </div>
          </div>

          <div className="row">
            <div className="section">
              <h2>newest changes</h2>
              <p>
                <em>May 20</em> - Manygolf has a new home at <a href="http://manygolf.club/">manygolf.club</a>! Your bookmarks and such should automatically redirect just fine.
              </p>
              <p>
                <em>May 17, again</em> - Added :) and :( emotes you can use. I've already gotten a request for keyboard shortcuts for these, will add them shortly!
              </p>
              <p>
                <em>May 17</em> - I added an end-of-round leaderboard. It currently just shows you the position everyone placed for the current hole, but is step 1 in adding some kind of persistent scoring across holes!
              </p>
            </div>
          </div>

          <div className="row">
            <div className="section">
              <h2>who</h2>
              <p>
                by thomas, with obvious debt to <a href="http://desertgolfing.captain-games.com/">desert golfing</a>
              </p>
              <p>
                updates/feedback: <a href="https://twitter.com/manygolf">@manygolf on twitter</a>
              </p>
              <p>
                <a href="https://github.com/thomasboyt/manygolf">code</a> /
                <a href="http://devlog.disco.zone/2016/04/18/manygolf/">tech notes</a> /
                <a href="http://disco.zone">disco.zone</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}