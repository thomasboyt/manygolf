import {Store} from 'redux';
import {State} from './records';
import inputHandler from './inputHandler';

/*
 * Subscription system allowing a component (the canvas) to subscribe to RunLoop updates instead of
 * Redux updates, preventing >60fps re-renders
 */
export type Subscriber = (state: State) => void;

let subscriber: Subscriber = (state) => {};

export function subscribe(cb: Subscriber) {
  subscriber = cb;
}

/*
 * Core run loop: handle input, tick, re-render using Subscription
 */

export function runLoopCb(dt: number, store: Store<State>) {
  dt = dt / 1000;  // ms -> s
  const dispatch = store.dispatch.bind(store);

  const prevState = store.getState();

  inputHandler(dt, prevState, dispatch);

  dispatch({
    type: 'tick',
    dt,
  });

  const newState = store.getState();

  subscriber(newState);
}
