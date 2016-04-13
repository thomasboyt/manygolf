var webpack = require('webpack');
var webpackMerge = require('webpack-merge');

var config = require('./base');
var secret = require('../secret');

module.exports = webpackMerge(config, {
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
        RAVEN_DSN: `"${secret.ravenDSN}"`
      }
    }),

    new webpack.optimize.UglifyJsPlugin()
  ],
});
