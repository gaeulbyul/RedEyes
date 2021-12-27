// const path = require('path')
// const webpack = require('webpack')

const mv2 = {
  // mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    site_twitter: './src/content/site-twitter.js',
    inject_twitter: './src/content/inject-twitter.js',
    options_ui: './src/options-ui/OptionsUI.bs.js',
  },
  output: {
    path: `${__dirname}/build-mv2/bundled`,
    filename: '[name].bun.js',
  },
  optimization: {},
  module: {
    rules: [],
  },
  plugins: [],
  resolve: {
    // extensions: ['.jsx', '.js'],
    // alias: {},
  },
}

const mv3 = { ...mv2 }
mv3.output = {
  ...mv2.output,
  path: `${__dirname}/build-mv3/bundled`,
}

module.exports = [mv2, mv3]