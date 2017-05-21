import * as React from 'react';
import {connect, Dispatch} from 'react-redux';

import IconButton from './IconButton';

const menuIconUrl = require('../../../../assets/menu.png');

interface Props {
  dispatch: Dispatch<any>;
}

class MenuControl extends React.Component<Props, {}> {
  handleClick(e: React.MouseEvent<any>) {
    this.props.dispatch({
      type: 'toggleInfoScreen'
    });
  }

  render() {
    return (
      <IconButton
        icon={menuIconUrl}
        onClick={(e) => this.handleClick(e)} />
    );
  }
}

export default connect()(MenuControl);