/*
 * lets you define a reducer as a series of action handlers that return new state
 *
 * example:
 *
 * const reducer = createImmutableReducer(initialState, {
 *   [ACTION_TYPE]: function(action, state) {
 *     return state.set('field', action.field);
 *   }
 * });
 */

export default function createImmutableReducer(initialState, handlers) {
  return (state = initialState, action) => {
    if (handlers[action.type]) {
      const newState = handlers[action.type](state, action);
      return newState;
    } else {
      return state;
    }
  };
}
