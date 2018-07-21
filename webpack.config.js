const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const DEV = process.env.NODE_ENV === 'development';

const baseConfig = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader?presets[]=env&plugins[]=transform-runtime']
      }
    ]
  }
};

const devConfig = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js'
  },
  entry: {
    demo: './demo/demo.js',
    lib: './src/index.js'
  },
  devtool: 'source-map',
  mode: 'development',
  devServer: {
    contentBase: [
      path.join(__dirname, 'demo'),
      path.join(__dirname, 'dist')
    ],
    compress: true,
    port: 8080
  }
};

const prodConfig = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sharawadji.min.js'
  },
  entry: './src/index.js',
  mode: 'production',
  optimization: {
    minimizer: [
      new UglifyJsPlugin()
    ]
  }
};

module.exports = Object.assign({}, baseConfig, DEV ? devConfig : prodConfig);
