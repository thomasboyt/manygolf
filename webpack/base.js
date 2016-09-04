var createVendorChunk = require('webpack-create-vendor-chunk');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: './src/client/main.tsx',
    standalone: './src/client/standalone.tsx',
  },

  output: {
    path: './build/client',
    filename: '[name].[chunkhash].js'
  },

  plugins: [
    createVendorChunk(),
    new ExtractTextPlugin('[name].[chunkhash].css'),

    new HtmlWebpackPlugin({
      template: './templates/index.html',
      filename: 'index.html',
      inject: 'body',
      chunks: ['vendor', 'app'],
    }),

    new HtmlWebpackPlugin({
      template: './templates/standalone.html',
      filename: 'standalone.html',
      inject: 'body',
      chunks: ['vendor', 'standalone'],
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
        loaders: ['babel', 'ts']
      },

      {
        test: /\.js$/,
        exclude: /(node_modules\/)/,
        loader: 'babel-loader',
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
      }

    ]
  },

  devServer: {
    contentBase: 'static',
    historyApiFallback: true,

    proxy: {
      '/server': {
        target: 'ws://localhost:4080',
        ws: true,
      },
    },
  },
};
