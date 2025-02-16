const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    modern: './src/index.tsx',
    legacy: './app/js/src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.glsl$/,
        use: 'raw-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['modern']
    }),
    new HtmlWebpackPlugin({
      template: './app/index.html',
      filename: 'particle.html',
      chunks: ['legacy'],
      inject: false
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'app/images', to: 'images' },
        { from: 'app/css', to: 'css' },
        { from: 'app/js/lib', to: 'js/lib' },
        { from: 'app/js/src', to: 'js/src' },
        { from: 'app/shaders', to: 'shaders' }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    hot: true
  }
};