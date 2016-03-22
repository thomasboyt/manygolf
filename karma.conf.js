var webpackConfig = require('./webpack/test');

module.exports = function(config) {
  config.set({

    browsers: ['Chrome'],
    frameworks: ['mocha'],
    reporters: ['mocha'],

    files: [
      'src/client/__tests__/index.js',
    ],

    preprocessors: {
      'src/client/__tests__/index.js': ['webpack', 'sourcemap']
    },

    webpack: webpackConfig,

    webpackServer: {
      noInfo: true,
    },
  });
};
