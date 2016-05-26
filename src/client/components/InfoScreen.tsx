import * as React from 'react';

interface Props {
  onRequestClose: () => void;
}

class InfoScreen extends React.Component<Props, {}> {
  render() {
    const style = {
      position: 'fixed',
      opacity: 0.8,
      width: '100%',
      height: '100%',
      background: 'black',
      zIndex: 2,
      padding: '0px 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      <div style={style} onClick={() => this.props.onRequestClose()}>
        <div>
          <h1>Manygolf</h1>

          <p>
            manygolf is a massively multiplayer golf game. everyone plays together, simultaneously,
            in the same session.
          </p>
          <p>
            whoever wins the round in the fewest number of strokes wins. in the event of a tie, the player
            who scores the fastest wins.
          </p>
          <p>
            (tap anywhere to continue)
          </p>
        </div>
      </div>
    );
  }
}

export default InfoScreen;