// XXX: We can't use babel-polyfill for dev because the
// polyfilled promise library breaks stack traces:
// import 'babel-polyfill';

// So instead we manually import polyfills...

import 'core-js/es6/array';
import 'core-js/es6/object';
import 'core-js/es6/set';
import 'core-js/es6/map';
