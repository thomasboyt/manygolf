var createVendorChunk = require('webpack-create-vendor-chunk');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    homepage: ['./src/client/homepage/main.ts'],
    game: ['whatwg-fetch', './src/client/standalone.tsx'],
  },

  output: {
    path: './build/client',
    filename: '[name].[chunkhash].js'
  },

  plugins: [
    createVendorChunk({
      name: 'game.vendor',
      chunks: ['game'],
    }),

    new ExtractTextPlugin('[name].[chunkhash].css'),

    new HtmlWebpackPlugin({
      template: './templates/index.html',
      filename: 'index.html',
      inject: 'body',
      chunks: ['homepage'],
    }),

    new HtmlWebpackPlugin({
      template: './templates/standalone.html',
      filename: 'standalone.html',
      inject: 'body',
      chunks: ['game.vendor', 'game'],
    }),
  ],

  resolve: {
    extensions: ['', '.jsx', '.js', '.tsx', '.ts'],

    alias: {
      '__root': process.cwd(),
    },
  },

  devtool: 'source-map',

  ts: {
    compilerOptions: {
      noEmit: false,
    },
  },

  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'ts'
      },

      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract(['css', 'less']),
      },
      {
        test: /(?:\.woff$|\.woff2$|\.ttf$|\.svg$|\.eot$)/,
        loader: 'file-loader',
        query: {
          name: '/font/[hash].[ext]'
        }
      },
      {
        test: /(?:\.mp3$|\.png$|\.gif$)/,
        loader: 'file-loader',
        query: {
          name: '/assets/[hash].[ext]'
        }
      },

      {
        test: /(?:\.json)/,
        loader: 'json-loader'
      },

      {
        test: /\.html$/,
        loader: 'html-loader'
      },
    ]
  },

  devServer: {
    contentBase: 'static',
  },
};
