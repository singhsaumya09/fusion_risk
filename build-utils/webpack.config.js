const commonPaths = require('./common-paths');
const webpack = require('webpack');
const project = require('./project.config')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BASE_CSS_LOADER = 'css-loader?sourceMap&-minimize'
const port = process.env.PORT || 3003


console.log('process.env :: ',process.env.NODE_ENV);
const config = {
  mode: process.env.NODE_ENV,
  cache: true,

  entry: {
    app: `${commonPaths.appEntry}/main.js`,
    vendor: ['semantic-ui-react']
  },
  output: {
    path: commonPaths.outputPath,
    publicPath: '/',
    filename: '[name].[hash].js'
  },
  performance: {
    hints:false,

  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },{
        test    : /\.scss$/,
        exclude : /node_modules/,
        loaders : [
          'style-loader',
          BASE_CSS_LOADER,
          // 'postcss',
          'sass-loader?sourceMap'
        ]
      },
      {
        test    : /\.css$/,
        exclude : /node_modules/,
        loaders : [
          'style-loader',
          BASE_CSS_LOADER,
          // 'postcss'
        ]
      },
      {
        test: /\.(png|svg|jpeg|jpg|gif)$/,
        exclude : /node_modules/,
        loaders : [
          'file-loader',
        ]
      },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html'
    })
  ]
};
if(process.env.NODE_ENV == 'development'){
  config.plugins.push(
      new webpack.HotModuleReplacementPlugin()
  );
  config.devServer = {
    host: 'localhost',
    port: port,
    historyApiFallback: true,
    hot: true,
    open: false,
    inline : false
  }
}
module.exports = config;
