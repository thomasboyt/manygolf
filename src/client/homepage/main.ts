require('../../../styles/main.less');

const container = document.querySelector('.twitter-container');

(window as any).twttr.ready(() => {
  (window as any).twttr.widgets.createTimeline({
    sourceType: 'profile',
    screenName: 'manygolf',
  }, container, {

    theme: 'dark',
    width: 500,
    tweetLimit: 5,
    chrome: 'noheader noscrollbar nofooter transparent',

  }).then(() => {
    // dark arts here...
    const iframe = container.getElementsByClassName('twitter-timeline')[0] as HTMLIFrameElement;
    const timeline = iframe.contentDocument;
    const head = timeline.getElementsByTagName('head')[0];

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css?family=Press+Start+2P';
    fontLink.rel = 'stylesheet';
    fontLink.type = 'text/css';
    head.appendChild(fontLink);

    const style = document.createElement('style');
    style.textContent = `
      * { font-family: "Press Start 2P" !important }
      .timeline-Tweet-text {
        font-size: 12px !important;
        line-height: 20px !important;
      }
    `;
    head.appendChild(style);

    timeline.getElementsByTagName('head')[0].appendChild(style);
  });
});