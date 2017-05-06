var fs = require('fs');
var webpack = require('webpack');

var nodeModules = {};

/*
 * Prevent bundling of node modules
 */
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: {
    server: './src/server/main.ts',
  },

  target: 'node',

  output: {
    path: './build/server',
    filename: '[name].bundle.js'
  },

  resolve: {
    extensions: ['', '.jsx', '.js', '.tsx', '.ts'],

    alias: {
      '__root': process.cwd(),
    },
  },

  devtool: 'source-map',

  externals: nodeModules,

  plugins: [
    new webpack.BannerPlugin('require("source-map-support").install();',
                             { raw: true, entryOnly: false })
  ],

  ts: {
    compilerOptions: {
      noEmit: false,
    },
  },

  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'ts',
      },
      // needed for raven
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
    ]
  }
};