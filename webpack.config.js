var path = require('path');

module.exports = {
  mode: 'production',
  target: 'electron-renderer',
  entry: './electron.dev.js',
  output: {
    path: path.resolve(__dirname, 'dist/openfin-visualizer'),
    filename: 'electron.js'
  }
};
