import * as diff from 'diffhtml';

const leftArrowUrl = require('../../assets/left.png');
const rightArrowUrl = require('../../assets/right.png');
const shootUrl = require('../../assets/shoot.png');
const happyUrl = require('../../assets/happy.png');
const sadUrl = require('../../assets/sad.png');

export enum ControlButton {
  LeftArrow,
  RightArrow,
  Shoot,
  ChatHappy,
  ChatSad,
}

export const buttonsDown = new Set<ControlButton>();

function renderControl(
  {type, className, icon}:
  {type: ControlButton, className: string, icon: string}) {

  const handleTouchStart = (e) => {
    e.preventDefault();
    buttonsDown.add(type);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    buttonsDown.delete(type);
  };

  return diff.html`
    <img src=${icon} class=${className} ontouchstart=${handleTouchStart} ontouchend=${handleTouchEnd} onmousedown=${handleTouchStart} onmouseup=${handleTouchEnd} />
  `;
}

function renderTouchControls() {
  return [{
    type: ControlButton.LeftArrow,
    className: 'left-arrow',
    icon: leftArrowUrl,
  }, {
    type: ControlButton.RightArrow,
    className: 'right-arrow',
    icon: rightArrowUrl,
  }, {
    type: ControlButton.ChatHappy,
    className: 'emoticon happy',
    icon: happyUrl,
  }, {
    type: ControlButton.ChatSad,
    className: 'emoticon sad',
    icon: sadUrl,
  }, {
    type: ControlButton.Shoot,
    className: 'shoot',
    icon: shootUrl,
  },].map(renderControl);
}

function renderDesktopControls() {
  return [{
    type: ControlButton.ChatHappy,
    className: 'emoticon happy',
    icon: happyUrl,
  }, {
    type: ControlButton.ChatSad,
    className: 'emoticon sad',
    icon: sadUrl,
  },].map(renderControl);
}

export function renderControlBar() {
  const controlBar = <HTMLElement>document.getElementsByClassName('control-bar')[0];

  let controls;

  // I know :(
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    const mobileOnly = Array.from(document.getElementsByClassName('mobile-only'));
    const hideMobile = Array.from(document.getElementsByClassName('hide-mobile'));

    for (let el of mobileOnly) {
      (<HTMLElement>el).style.display = 'block';
    }

    for (let el of hideMobile) {
      (<HTMLElement>el).style.display = 'none';
    }

    controls = renderTouchControls();

  } else {
    controls = renderDesktopControls();
  }

  diff.innerHTML(controlBar, controls);
}
