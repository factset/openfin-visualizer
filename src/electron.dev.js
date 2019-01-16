const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const openfin = require('./openfin');
const fs = require('fs');

let win;

const createWindow = () => {
  // set timeout to render the window not until the Angular
  // compiler is ready to show the project
  setTimeout(() => {
    win = new BrowserWindow({
      width: 1200,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      icon: './src/favicon.ico'
    });

    win.loadURL(url.format({
      pathname: 'localhost:4200',
      protocol: 'http:',
      slashes: true
    }));

    win.webContents.openDevTools({ mode: 'bottom' });

    win.webContents.on('did-navigate', event => openfin.disconnectAll());

    // Perhaps not necessary considering runtimes disconnect anyway
    win.on('close', () => openfin.disconnectAll());

    win.on('closed', () => win = null);
  }, 10000);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (win === null) createWindow();
});

ipcMain.on('save-log', (event, data) => {
  //let path = `${process.env.HOME}\\Downloads\\${data.runtime}-${data.uuid}-${data.topic}-${new Date().toJSON()}-log.txt`;
  let filename = `OFV-${data.runtime}-${data.uuid === '*' ? 'all' : data.uuid}-${data.topic}.txt`;
  let path;
  if (app.isPackaged) {
    path = `%USERPROFILE%\\Desktop\\${filename}`;
  } else {
    path = `${process.env.HOME}\\Desktop\\${filename}`;
  }

  console.log(`Saving log to ${path}`);
  fs.writeFile(path, data.log, err => {
    if (err) {
      console.log(`Could not save log to ${path}`);
      event.sender.send('info', { body: `Could not save log to ${path}`} );
    } else {
      console.log(`Log saved to ${path}`);
      event.sender.send('info', { body: `Log saved to Desktop!`} );
    }
  });

});
