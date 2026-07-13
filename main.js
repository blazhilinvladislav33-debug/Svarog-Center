const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let splashWindow;
let mainWindow;
let tray = null;
let isQuitting = false; // Прапорець, щоб розрізняти "згорнути" і "повністю вийти"

function createSplashScreen() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    splashWindow.loadFile('splash.html');
}

function createMainWindow() {
    if (mainWindow) return;

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false, // Ховаємо, поки повністю не завантажиться
        title: "SVAROG TEAM | Command Center",
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile('admin.html');

    mainWindow.once('ready-to-show', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close(); // Закриваємо радар
        }
        mainWindow.show(); // Показуємо вікно програми
    });

    // ПЕРЕХОПЛЮЄМО ЗАКРИТТЯ ВІКНА (ХРЕСТИК)
    mainWindow.on('close', function (event) {
        if (!isQuitting) {
            event.preventDefault(); // Скасовуємо стандартне закриття
            mainWindow.hide();      // Просто ховаємо вікно у трей
        }
        return false;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'logo.png'));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Відкрити SVAROG Center',
            click: () => { if (mainWindow) mainWindow.show(); }
        },
        { type: 'separator' },
        {
            label: 'Вийти з програми',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('SVAROG Command Center\nПрацює у фоновому режимі');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) mainWindow.hide();
            else mainWindow.show();
        }
    });
}

app.whenReady().then(() => {
    createSplashScreen();
    createTray();

    // Завжди запускаємо головне вікно через 2 секунди
    setTimeout(() => {
        createMainWindow();

        // Починаємо фоновий пошук оновлень (якщо це зібрана програма)
        if (app.isPackaged) {
            autoUpdater.checkForUpdatesAndNotify().catch((err) => {
                console.error("Помилка сервера оновлень:", err);
            });

            // Додатково перевіряємо оновлення періодично, поки програма
            // залишається відкритою/у треї — щоб реліз на GitHub підхоплювався
            // "на льоту", без потреби перезапускати SVAROG Center вручну.
            const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 хвилин
            setInterval(() => {
                autoUpdater.checkForUpdatesAndNotify().catch((err) => {
                    console.error("Помилка періодичної перевірки оновлень:", err);
                });
            }, UPDATE_CHECK_INTERVAL_MS);
        } else {
            console.log("Режим розробника: оновлення вимкнені");
        }
    }, 2000);

    // Коли оновлення завантажилось, питаємо користувача
    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            title: 'Оновлення системи',
            message: 'Нова версія SVAROG Command Center успішно завантажена.',
            buttons: ['Оновити та перезапустити', 'Зробити це пізніше']
        }).then((result) => {
            if (result.response === 0) {
                isQuitting = true;
                autoUpdater.quitAndInstall();
            }
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Залишаємо висіти в треї
    }
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            if (!mainWindow.isVisible()) mainWindow.show();
            mainWindow.focus();
        }
    });
}