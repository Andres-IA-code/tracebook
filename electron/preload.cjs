const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  quit: () => ipcRenderer.send("app-quit"),
});
