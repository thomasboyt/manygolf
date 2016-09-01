import * as React from 'react';

export default class TwitterTimeline extends React.Component<{}, {}> {
  componentDidMount() {
    (window as any).twttr.ready(() => {
      (window as any).twttr.widgets.createTimeline({
        sourceType: 'profile',
        screenName: 'manygolf',
      }, this.refs['container'], {

        theme: 'dark',
        width: 500,
        height: 500,
        chrome: 'noheader noborder nofooter transparent',

      }).then(() => {
        // dark arts here...
        const iframe = (this.refs['container'] as Element).getElementsByClassName('twitter-timeline')[0];
        const timeline = (iframe as HTMLIFrameElement).contentDocument;
        const style = document.createElement('style');
        style.textContent = `
          * { font-family: "Press Start 2P" !important }
          .timeline-Tweet-text {
            font-size: 12px !important;
            line-height: 20px !important;
          }
        `;

        timeline.getElementsByTagName('head')[0].appendChild(style);
      });
    });

  }

  render() {
    return (
      <div ref="container" />
    );
  }
}