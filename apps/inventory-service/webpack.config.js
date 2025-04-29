const {NxAppWebpackPlugin} = require('@nx/webpack/app-plugin');
const {join} = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/inventory-service'),
  },
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: process.env.NODE_ENV === 'development',
    }),
  ],
};
