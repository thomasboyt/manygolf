const webpack = require('webpack');

const baseConfig = require('./server');

const config = Object.assign(baseConfig, {
  entry: {
    test: './src/testEntry.js',
  },

  output: {
    path: './build/test',
    filename: '[name].bundle.js'
  },

  devtool: 'inline-source-map',

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"test"'
      }
    }),
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  ],
});

module.exports = config;
