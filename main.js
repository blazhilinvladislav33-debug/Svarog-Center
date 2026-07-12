const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
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

    // Завантажуємо наш новий об'єднаний файл адмінки
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
            mainWindow.hide();      // Просто ховаємо вікно

            // Якщо операційна система Windows, можемо показати підказку (Notification),
            // але ми вже маємо системні сповіщення для замовлень, тому просто ховаємо.
        }
        return false;
    });
}

function createTray() {
    // Створюємо іконку біля годинника
    tray = new Tray(path.join(__dirname, 'logo.png'));

    // Меню, яке відкривається при кліку правою кнопкою миші по іконці в треї
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Відкрити SVAROG Center',
            click: () => {
                if (mainWindow) mainWindow.show();
            }
        },
        { type: 'separator' },
        {
            label: 'Вийти з програми',
            click: () => {
                isQuitting = true; // Знімаємо блокування закриття
                app.quit();        // Повністю вбиваємо процес
            }
        }
    ]);

    tray.setToolTip('SVAROG Command Center\nПрацює у фоновому режимі');
    tray.setContextMenu(contextMenu);

    // Подвійний клік лівою кнопкою миші відкриває/ховає програму
    tray.on('double-click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
            }
        }
    });
}

app.whenReady().then(() => {
    createSplashScreen();
    createTray(); // Ініціалізуємо трей при запуску

    setTimeout(() => {
        // Перевіряємо, чи ми в режимі розробки, чи це встановлений .exe
        if (!app.isPackaged) {
            console.log("Режим розробника: пропускаємо оновлення");
            createMainWindow();
        } else {
            autoUpdater.checkForUpdatesAndNotify().catch((err) => {
                console.error("Помилка підключення до сервера оновлень:", err);
                createMainWindow();
            });
        }
    }, 2000);

    autoUpdater.on('update-not-available', () => {
        createMainWindow();
    });

    autoUpdater.on('error', (err) => {
        createMainWindow();
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let percent = Math.round(progressObj.percent);
        let speed = Math.round(progressObj.bytesPerSecond / 1024) + " KB/s";
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.webContents.send('update-progress', { percent, speed });
        }
    });

    autoUpdater.on('update-downloaded', () => {
        isQuitting = true; // Дозволяємо програмі закритися для оновлення
        autoUpdater.quitAndInstall();
    });
});

// Щоб програма не закривалася на Mac, коли всі вікна сховані
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Ми не викликаємо app.quit(), щоб програма висіла в треї
    }
});

// Якщо програму намагаються відкрити ще раз (другий екземпляр)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Якщо хтось клікає на ярлик, а програма вже в треї - розгортаємо її
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            if (!mainWindow.isVisible()) mainWindow.show();
            mainWindow.focus();
        }
    });
}