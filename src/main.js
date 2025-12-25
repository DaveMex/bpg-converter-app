const { app, BrowserWindow, ipcMain, shell } = require('electron');
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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
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
