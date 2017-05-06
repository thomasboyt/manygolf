import * as React from 'react';

interface Props extends React.HTMLProps<HTMLButtonElement> {
  icon: string;
}

export default class IconButton extends React.Component<Props, {}> {
  render() {
    const {icon, className, ...props} = this.props;

    const innerStyle = {
      backgroundImage: `url("${this.props.icon}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '50px 50px',

      display: 'block',
      width: '100%',
      height: '100%',
    };

    // props as {} is a fix for https://github.com/Microsoft/TypeScript/issues/15469
    // can remove once a new version is out
    return (
      <button {...props as {}} className={`control-button ${className || ''}`}>
        <span style={innerStyle} />
      </button>
    );
  }
}
