var webpack = require('webpack');
var webpackMerge = require('webpack-merge');

var config = require('./base');

var serverUrl = process.env.MANYGOLF_SERVER_HOSTNAME || 'localhost:4080';

module.exports = webpackMerge(config, {
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: 'null',
        SERVER_URL: `"${serverUrl}"`,
      }
    }),
  ],
});
