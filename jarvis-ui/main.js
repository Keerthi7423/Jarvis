const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    backgroundColor: '#050913',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    win.loadURL('http://localhost:5173');
    return;
  }

  win.loadFile(path.join(__dirname, 'renderer', 'dist', 'index.html'));
}

ipcMain.handle('app:getVersion', () => app.getVersion());

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
