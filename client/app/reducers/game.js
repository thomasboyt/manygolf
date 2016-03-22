import I from 'immutable';
import createImmutableReducer from '../util/createImmutableReducer';
import {TICK} from '../ActionTypes';

// const Coordinates = I.Record({
//   x: null,
//   y: null,
// })
//
// const Level = I.Record({
// });

const State = I.Record({
  balls: I.List(),
  level: null,
});

export default createImmutableReducer(new State(), {
  [TICK]: function(state, action) {
    return state;
  }
})
