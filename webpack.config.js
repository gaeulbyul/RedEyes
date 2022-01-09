const path = require('path')
// const webpack = require('webpack')

// TODO: https://webpack.js.org/configuration/mode/#:~:text=If%20you%20want%20to%20change%20the%20behavior%20according%20to%20the%20mode%20variable%20inside%20the%20webpack.config.js%2C%20you%20have%20to%20export%20a%20function%20instead%20of%20an%20object%3A
const prod = false

const mv2 = {
  // mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    background: './src/background/background.js',
    options_ui: './src/options-ui/options-ui.js',
    site_twitter: './src/content/site-twitter.js',
  },
  output: {
    path: `${__dirname}/build-mv2/bundled`,
    filename: '[name].bun.js',
  },
  optimization: {},
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: require.resolve('svelte-loader'),
          options: {
            compilerOptions: {
              dev: !prod,
            },
            emitCss: prod,
            hotReload: false,
          },
        },
      },
      {
        test: /\.css$/,
        use: require.resolve('css-loader'),
      },
      {
        // required to prevent errors from Svelte on Webpack 5+
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  plugins: [],
  resolve: {
    extensions: ['.svelte', '.mjs', '.jsx', '.js'],
    alias: {
      svelte: path.dirname(require.resolve('svelte/package.json')),
    },
  },
}

const mv3 = { ...mv2 }
mv3.output = {
  ...mv2.output,
  path: `${__dirname}/build-mv3/bundled`,
}

module.exports = [mv2, mv3]
