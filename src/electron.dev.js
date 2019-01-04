const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const openfin = require('./openfin');

let win;

const createWindow = () => {
  // set timeout to render the window not until the Angular
  // compiler is ready to show the project
  setTimeout(() => {
    win = new BrowserWindow({
      width: 1200,
      height: 900,
      icon: './src/favicon.ico'
    });

    win.loadURL(url.format({
      pathname: 'localhost:4200',
      protocol: 'http:',
      slashes: true
    }));

    win.webContents.openDevTools({ mode: 'bottom' });

    win.on('close', () => openfin.disconnectAll());

    win.on('closed', () => {
      win = null;
    });
  }, 10000);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
