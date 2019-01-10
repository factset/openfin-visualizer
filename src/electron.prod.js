const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const openfin = require('./openfin');

let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: path.join(__dirname, 'favicon.ico'),
  });

  win.setMenu(null);

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  win.on('close', () => openfin.disconnectAll());

  win.on('closed', () => win = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (win === null) createWindow();
});
