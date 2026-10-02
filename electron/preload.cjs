const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("verticeDesktop", {
  quit: () => ipcRenderer.send("app-quit"),
});
