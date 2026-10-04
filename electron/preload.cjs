const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vectorDesktop", {
  quit: () => ipcRenderer.send("app-quit"),
});
