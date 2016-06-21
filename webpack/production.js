var webpack = require('webpack');
var webpackMerge = require('webpack-merge');

var config = require('./base');
var secret = require('../secret');

var execSync = require('child_process').execSync;
var sha = execSync('git rev-parse --short HEAD', {encoding: 'utf8'}).trim();

module.exports = webpackMerge(config, {
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
        RAVEN_DSN: `"${secret.ravenDSNPublic}"`,
        BUILD_SHA: `"${sha}"`,
      }
    }),

    new webpack.optimize.UglifyJsPlugin()
  ],
});
