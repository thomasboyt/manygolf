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

export interface IHandlers<S, A> {
  [type: string]: (state: S, action: A) => S;
}

export default function createImmutableReducer<S, A=any>(initialState: S, handlers: IHandlers<S, A>) {
  return (state = initialState, action?: any) => {
    if (handlers[action.type]) {
      const newState = handlers[action.type](state, action);
      return newState;
    } else {
      return state;
    }
  };
}
