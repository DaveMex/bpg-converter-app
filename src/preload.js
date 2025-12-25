const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
    convertImage: (data) => ipcRenderer.invoke('convert-image', data),
    getFilePath: (file) => webUtils.getPathForFile(file),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path)
});
