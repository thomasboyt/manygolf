import * as React from 'react';
import {connect} from 'react-redux';

import TwitterAuth from '../TwitterAuth';
import {State} from '../../records';

interface Props {
  name: string;
}

class PlayerScreen extends React.Component<Props, {}> {
  render() {
    const {name} = this.props;

    return (
      <div>
        <h2>account</h2>

        <p>
          you are <strong>{name}</strong>
        </p>

        <TwitterAuth />
      </div>
    );
  }
}

function select(state: State) {
  return {
    name: state.name,
  };
}

export default connect(select)(PlayerScreen);