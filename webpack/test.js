var webpack = require('webpack');

var baseConfig = require('./base');

module.exports = {
  devtool: 'inline-source-map',

  module: baseConfig.module,

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"test"'
      }
    }),
  ],
};
