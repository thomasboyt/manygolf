import * as React from 'react';

class HelpScreen extends React.Component<{}, {}> {
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

  render() {
    return (
      <div>
        <h2>about</h2>
        <p>
          manygolf is a massively multiplayer golf game. everyone plays together, simultaneously,
          in the same session.
        </p>
        <p>
          whoever wins the round in the fewest number of strokes wins. in the event of a tie, the player
          who scores the fastest wins.
        </p>
        {this.maybeRenderRev()}
      </div>
    );
  }
}

export default HelpScreen;