import * as React from 'react';
import isTouch from '../util/isTouch';

import TwitterLink from './TwitterLink';
import TwitterTimeline from './Timeline';
import GameContainer from './GameContainer';

import {getHttpApiUrl} from '../api';

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

  maybeRenderRev() {
    if (process.env.NODE_ENV === 'production') {
      const sha = process.env.BUILD_SHA;

      return (
        <p>
          build: {sha}
        </p>
      );
    }
  }

  handleTwitterAuth() {
    // WHAT A COOL API YOU ARE, WINDOW.OPEN(). JUST REALLY SO INTUITIVE
    window.open(
      `${getHttpApiUrl()}/twitter-sign-in`,
      'TwitterSignIn',
      'resizable,scrolbars,status,width=500,height=400'
    );
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

        <div className="row">
          <p style={{textAlign: 'center'}}>
            <a onClick={this.handleTwitterAuth}>Sign in with Twitter</a>
          </p>
        </div>

        <div className="instructions">

          <div className="row">
            <div className="section">
              <p>
                <a
                  style={{color: "#fff203"}}
                  href="http://steamcommunity.com/sharedfiles/filedetails/?id=751794609">
                  Vote for Manygolf on Steam Greenlight!
                </a>
              </p>
              <p>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScAJAsaPGTE_elKg5MbqXgsa-W1rbrWRdDQGi-gXLBgaTM34Q/viewform">
                  Join the iOS beta
                </a>
                {' / '}
                <a
                  href="https://play.google.com/apps/testing/com.thomasboyt.manygolf">
                  Join the Android beta
                </a>
              </p>
            </div>
          </div>

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

          <div className="updates-full">
            <div className="row">
              <div className="section">
                <h2>updates</h2>

                <TwitterTimeline />

                <p style={{marginTop: '30px'}}>
                  for more updates &amp; feedback, visit <a href="https://twitter.com/manygolf">@manygolf on twitter</a>
                </p>
              </div>
            </div>
          </div>

          <div className="updates-mobile">
            <div className="row">
              <div className="section">
                <h2>updates &amp; feedback</h2>
                <p>
                  visit <a href="https://twitter.com/manygolf">@manygolf on twitter</a>!
                </p>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="section">
              <h2>who</h2>
              <p>
                by thomas, with obvious debt to <a href="http://desertgolfing.captain-games.com/">desert golfing</a>
              </p>
              <p>
                <a href="https://github.com/thomasboyt/manygolf">code</a> /{' '}
                <a href="http://devlog.disco.zone/2016/04/18/manygolf/">tech notes</a> /{' '}
                <a href="http://disco.zone">disco.zone</a>
              </p>

              {this.maybeRenderRev()}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
