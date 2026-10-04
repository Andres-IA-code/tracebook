const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("brechaDesktop", {
  quit: () => ipcRenderer.send("app-quit"),
});
