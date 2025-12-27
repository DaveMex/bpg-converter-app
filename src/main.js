const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const { execFile } = require('child_process');
const os = require('os');
const fs = require('fs');

// Disable hardware acceleration to fix EGL/Rendering connection errors on some Mac environments
app.disableHardwareAcceleration();

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true,
        backgroundColor: '#121212',
        icon: path.join(__dirname, 'assets', 'icon.ico')
    });

    win.loadFile(path.join(__dirname, 'index.html'));
    // win.webContents.openDevTools(); // Disabled for production/usage
}

app.whenReady().then(() => {
    createWindow();

    // Auto-updater config
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';

    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Update events
autoUpdater.on('update-available', () => {
    log.info('Update available.');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Downloading now...'
    });
});

autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded');
    dialog.showMessageBox({
        type: 'question',
        title: 'Update Ready',
        message: 'Update downloaded. Restart and install?',
        buttons: ['Yes', 'Later']
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

autoUpdater.on('error', (err) => {
    log.info('Error in auto-updater. ' + err);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

ipcMain.handle('show-item-in-folder', async (event, filePath) => {
    await shell.showItemInFolder(filePath);
});

ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
    });
    return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('convert-image', async (event, { filePath, quality, compression, encoder }) => {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let binName = 'bpgenc';
        let platformDir = 'linux';

        if (platform === 'win32') {
            binName = 'bpgenc.exe';
            platformDir = 'win';
        } else if (platform === 'darwin') {
            platformDir = 'mac';
        }

        // Determine path to binary
        // When packaged, it might be in resources/bin
        // When dev, it's in resources/bin relative to root
        const isDev = !app.isPackaged;
        let binPath;

        if (isDev) {
            binPath = path.join(__dirname, '..', 'resources', 'bin', platformDir, binName);
        } else {
            binPath = path.join(process.resourcesPath, 'bin', platformDir, binName);
        }

        // Output file: same name but .bpg
        const outputDir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);
        const outputPath = path.join(outputDir, `${baseName}.bpg`);

        const args = [
            '-q', quality.toString(),
            '-m', compression.toString(),
            '-o', outputPath,
            filePath
        ];

        if (encoder === 'jctvc') {
            args.unshift('-e', 'jctvc');
        }

        execFile(binPath, args, (error, stdout, stderr) => {
            if (error) {
                console.error('Error:', stderr);
                reject(stderr || error.message);
                return;
            }
            resolve(outputPath);
        });
    });
});
