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

interface Handlers<T> {
  [type: string]: (state: T, action: any) => T;
}

export default function createImmutableReducer<T>(initialState: T, handlers: Handlers<T>) {
  return (state = initialState, action?: any) => {
    if (handlers[action.type]) {
      const newState = handlers[action.type](state, action);
      return newState;
    } else {
      return state;
    }
  };
}
