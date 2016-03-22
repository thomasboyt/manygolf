import '../polyfill';

const context = require.context('../', true, /__tests__\/.*\.spec\.js$/);
context.keys().forEach(context);

it('works', () => {});
