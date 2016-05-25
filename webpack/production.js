var webpack = require('webpack');
var webpackMerge = require('webpack-merge');

var config = require('./base');
var secret = require('../secret');

module.exports = webpackMerge(config, {
  entry: {
    standalone: './src/client/standalone.tsx',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
        RAVEN_DSN: `"${secret.ravenDSNPublic}"`
      }
    }),

    new webpack.optimize.UglifyJsPlugin()
  ],
});
