/**
 * SVAROG Command Center v3.0.0
 * Electron Main Process
 *
 * Handles:
 * - App initialization
 * - Window creation
 * - Auto-update
 * - System tray
 * - Firebase integration
 */

const { app, BrowserWindow, Menu, ipcMain, Tray, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');
require('dotenv').config();

let mainWindow;
let tray = null;

// ============================================================
// APP INITIALIZATION
// ============================================================

const createWindow = () => {
  // Create splash screen
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));

  // Create main window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    show: false
  });

  // Load app
  const startUrl = isDev
    ? 'http://localhost:3000/auth.html'
    : `file://${path.join(__dirname, 'auth.html')}`;

  mainWindow.loadFile('auth.html');

  // Show main window after delay (remove splash)
  setTimeout(() => {
    mainWindow.show();
    splash.close();
  }, 500);

  // Open DevTools in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle any uncaught exceptions
  mainWindow.webContents.on('crashed', () => {
    dialog.showErrorBox('Application Error', 'The application has crashed. It will now restart.');
    app.relaunch();
    app.quit();
  });

  return mainWindow;
};

// ============================================================
// AUTO-UPDATE
// ============================================================

const setupAutoUpdate = () => {
  if (isDev) {
    console.log('Skipping auto-update in dev mode');
    return;
  }

  try {
    // Configure auto-updater
    autoUpdater.checkForUpdatesAndNotify();

    // Event handlers
    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `SVAROG v${info.version} is available.`,
        detail: 'The update will be downloaded in the background.',
        buttons: ['OK']
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info.version);
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `SVAROG v${info.version} is ready to install.`,
        detail: 'The application will restart to apply the update.',
        buttons: ['Restart Now', 'Later']
      }).then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    autoUpdater.on('error', (error) => {
      console.error('Update error:', error);
      dialog.showErrorBox('Update Error', error.message);
    });

    // Check for updates every 30 minutes
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 30 * 60 * 1000);

  } catch (error) {
    console.error('Auto-update setup error:', error);
  }
};

// ============================================================
// SYSTEM TRAY
// ============================================================

const createTray = () => {
  const trayIconPath = path.join(__dirname, 'build', 'icon-tray.png');
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Hide',
      click: () => {
        mainWindow.hide();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', 'settings');
      }
    },
    {
      label: 'Check for Updates',
      click: () => {
        if (!isDev) {
          autoUpdater.checkForUpdates();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
};

// ============================================================
// APP EVENTS
// ============================================================

app.on('ready', () => {
  // Single instance lock
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

  createWindow();
  createTray();
  setupAutoUpdate();

  // Create menu
  createMenu();

  // IPC handlers
  setupIpcHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ============================================================
// MENU
// ============================================================

const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'toggleFullScreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About SVAROG',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About SVAROG Command Center',
              message: 'SVAROG Command Center v3.0.0',
              detail: 'A complete admin dashboard for e-commerce businesses.\n\nBuilt with Electron, Firebase, and Node.js'
            });
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            if (!isDev) {
              autoUpdater.checkForUpdates();
            }
          }
        }
      ]
    }
  ];

  if (isDev) {
    template.push({
      label: 'Developer',
      submenu: [
        { role: 'toggleDevTools' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// ============================================================
// IPC HANDLERS
// ============================================================

const setupIpcHandlers = () => {
  // Get app version
  ipcMain.handle('get-version', () => {
    return app.getVersion();
  });

  // Get user data path
  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
  });

  // Open external link
  ipcMain.handle('open-external', (event, url) => {
    const { shell } = require('electron');
    shell.openExternal(url);
  });

  // Save settings
  ipcMain.handle('save-settings', (event, settings) => {
    try {
      const fs = require('fs');
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  });

  // Load settings
  ipcMain.handle('load-settings', (event) => {
    try {
      const fs = require('fs');
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      if (fs.existsSync(settingsPath)) {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      }
      return {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  });

  // Show save dialog
  ipcMain.handle('show-save-dialog', async (event, options) => {
    return dialog.showSaveDialog(mainWindow, options);
  });

  // Show open dialog
  ipcMain.handle('show-open-dialog', async (event, options) => {
    return dialog.showOpenDialog(mainWindow, options);
  });

  // Show message box
  ipcMain.handle('show-message-box', async (event, options) => {
    return dialog.showMessageBox(mainWindow, options);
  });

  // Check for updates (manual)
  ipcMain.handle('check-for-updates', async () => {
    if (isDev) {
      return { message: 'Auto-update disabled in dev mode' };
    }
    return autoUpdater.checkForUpdates();
  });

  // Minimize window
  ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
  });

  // Maximize window
  ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  // Close window
  ipcMain.handle('close-window', () => {
    mainWindow.close();
  });
};

// ============================================================
// DEVELOPMENT SETUP
// ============================================================

if (isDev) {
  require('electron-debug')({ showDevTools: true });
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = { createWindow, setupAutoUpdate, createTray };
