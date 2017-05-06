import * as React from 'react';

import IconButton from './IconButton';

import {
  ControlButton,
  buttonsDown,
} from '../../buttons';

interface ControlProps {
  type: ControlButton;
  className: string;
  icon: string;
}

export default class GameControl extends React.Component<ControlProps, {}> {
  handleTouchStart(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    buttonsDown.add(this.props.type);
  }

  handleTouchEnd(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    buttonsDown.delete(this.props.type);
  }

  render() {
    const {icon, className} = this.props;

    return (
      <IconButton className={className}
        icon={icon}
        onTouchStart={(e) => this.handleTouchStart(e)}
        onTouchEnd={(e) => this.handleTouchEnd(e)}
        onMouseDown={(e) => this.handleTouchStart(e)}
        onMouseUp={(e) => this.handleTouchEnd(e)} />
    );
  }
}
