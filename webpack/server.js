var fs = require('fs');
var webpack = require('webpack');

var nodeModules = {};

const babelSettings = {
  babelrc: false,
  plugins: [
    'transform-es2015-modules-commonjs',
    'transform-es2015-destructuring',
    'transform-es2015-spread',
    'transform-es2015-parameters',
    'transform-async-to-generator'
  ],
};

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
        loaders: ['babel?' + JSON.stringify(babelSettings), 'ts'],
      },
      {
        test: /\.js$/,
        exclude: /(node_modules\/)/,
        loader: 'babel-loader',
        query: babelSettings,
      },
      // needed for raven
      {
        test: /\.json$/,
        loader: "json-loader"
      },
    ]
  }
};