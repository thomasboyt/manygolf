var webpackConfig = require('./webpack/test');

module.exports = function(config) {
  config.set({

    browsers: ['Chrome'],
    frameworks: ['mocha'],
    reporters: ['mocha'],

    files: [
      'app/__tests__/index.js',
    ],

    preprocessors: {
      'app/__tests__/index.js': ['webpack', 'sourcemap']
    },

    webpack: webpackConfig,

    webpackServer: {
      noInfo: true,
    },
  });
};
