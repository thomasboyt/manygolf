const leftArrowUrl = require('../../assets/left.png');
const rightArrowUrl = require('../../assets/right.png');
const shootUrl = require('../../assets/shoot.png');

export enum ControlButton {
  LeftArrow,
  RightArrow,
  Shoot,
}

export const buttonsDown = new Set<ControlButton>();

function createControl(controlBar: HTMLElement, button: ControlButton,
                       className: string, path: string) {
  const control = document.createElement('img');
  control.src = path;
  control.className = className;

  control.ontouchstart = (e) => {
    e.preventDefault();
    buttonsDown.add(button);
  };

  control.ontouchend = (e) => {
    e.preventDefault();
    buttonsDown.delete(button);
  };

  controlBar.appendChild(control);
}

export function renderControlBar() {
  const controlBar = <HTMLElement>document.getElementsByClassName('control-bar')[0];

  createControl(controlBar, ControlButton.LeftArrow, 'left-arrow', leftArrowUrl);
  createControl(controlBar, ControlButton.RightArrow, 'right-arrow', rightArrowUrl);
  createControl(controlBar, ControlButton.Shoot, 'shoot', shootUrl);

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
  }
}
