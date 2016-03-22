import I from 'immutable';
import createImmutableReducer from '../util/createImmutableReducer';
import {TICK} from '../ActionTypes';

// const Coordinates = I.Record({
//   x: null,
//   y: null,
// })
//
const Level = I.Record({
  points: null,
  hole: null,
  spawn: null,
});

const State = I.Record({
  balls: I.List(),
  level: null,
});

export default createImmutableReducer(new State(), {
  [TICK]: (state, action) => {
    return state;
  },

  'ws:level': (state, action) => {
    const level = action.data;

    const levelRec = new Level(I.fromJS(level));

    return state.set('level', levelRec);
  },
});
