import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';

import appReducer from './reducers';

const middleware = [
  thunkMiddleware,
];

export default function createAppStore(data) {
  return createStore(appReducer, data, applyMiddleware(...middleware));
}
