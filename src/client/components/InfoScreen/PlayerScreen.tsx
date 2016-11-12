import * as React from 'react';
import {connect} from 'react-redux';

import TwitterAuth from '../TwitterAuth';

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

function select(state) {
  return {
    name: state.name,
  };
}

export default connect(select)(PlayerScreen);