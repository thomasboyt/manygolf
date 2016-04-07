var createVendorChunk = require('webpack-create-vendor-chunk');

module.exports = {
  entry: {
    app: './src/client/main.js',
  },

  output: {
    path: './build/',
    filename: '[name].bundle.js'
  },

  plugins: [
    createVendorChunk()
  ],

  resolve: {
    extensions: ['', '.jsx', '.js', '.tsx', '.ts'],

    alias: {
      '__root': process.cwd(),
    },
  },

  devtool: 'source-map',

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
        loader: 'style-loader!css-loader!less-loader'
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
    historyApiFallback: true,

    proxy: {
      '/server': {
        target: 'ws://localhost:4080',
        ws: true,
      },
    },
  },
};
