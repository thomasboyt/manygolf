import React from 'react';

interface Props extends React.HTMLProps<HTMLButtonElement> {
  icon: string;
}

export default class IconButton extends React.Component<Props, {}> {
  render() {
    const className = this.props.className || '';

    const innerStyle = {
      backgroundImage: `url("${this.props.icon}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '50px 50px',

      display: 'block',
      width: '100%',
      height: '100%',
    };

    return (
      <button {...this.props} className={`control-button ${className}`}>
        <span style={innerStyle} />
      </button>
    );
  }
}
