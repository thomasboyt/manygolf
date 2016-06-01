export enum ControlButton {
  LeftArrow,
  RightArrow,
  Shoot,
  ChatHappy,
  ChatSad,
}

// TODO: Put this in a reducer or something
export const buttonsDown = new Set<ControlButton>();
