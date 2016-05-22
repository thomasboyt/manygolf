import * as React from 'react';
import {connect} from 'react-redux';

interface Props {
  name: string;
}

class TwitterLink extends React.Component<Props, {}> {
  render() {
    let text;

    if (this.props.name) {
      text = encodeURIComponent(`Come play @Manygolf with me! I'm playing as ${this.props.name}`);
    } else {
      text = encodeURIComponent('Come play @Manygolf with me!');
    }

    return (
      <a
        href={`https://twitter.com/intent/tweet?text=${text}&url=http%3A%2F%2Fmanygolf.club`}
        target="_blank"
        rel="noopener">
        make tweet
      </a>
    )
  }
}

function select(state) {
  return {
    name: state.name,
  }
}

export default connect(select)(TwitterLink);