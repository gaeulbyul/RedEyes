const path = require('path')
// const webpack = require('webpack')
const sveltePreprocess = require('svelte-preprocess')

// TODO: https://webpack.js.org/configuration/mode/#:~:text=If%20you%20want%20to%20change%20the%20behavior%20according%20to%20the%20mode%20variable%20inside%20the%20webpack.config.js%2C%20you%20have%20to%20export%20a%20function%20instead%20of%20an%20object%3A
const prod = false

const mv2 = {
  // mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    background: './src/background/background.ts',
    options_ui: './src/options-ui/options-ui.ts',
    site_twitter: './src/content/site-twitter.ts',
    site_generic: './src/content/site-generic.ts',
    site_github: './src/content/site-github.ts',
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
            preprocess: sveltePreprocess({}),
            compilerOptions: {
              dev: !prod,
            },
            emitCss: prod,
            hotReload: false,
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: require.resolve('swc-loader'),
        // exclude: /node_modules/,
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
    extensions: ['.svelte', '.mjs', '.tsx', '.ts', '.jsx', '.js'],
    alias: {
      svelte: path.dirname(require.resolve('svelte/package.json')),
    },
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
}

const mv3 = { ...mv2 }
mv3.output = {
  ...mv2.output,
  path: `${__dirname}/build-mv3/bundled`,
}

module.exports = [mv2, mv3]
