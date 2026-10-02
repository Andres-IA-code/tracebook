const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("node:path");

// Vértice is fully local: skip Chromium services that otherwise run during startup.
app.commandLine.appendSwitch("disable-background-networking");
app.commandLine.appendSwitch("disable-component-update");
app.commandLine.appendSwitch("disable-default-apps");
app.commandLine.appendSwitch("disable-domain-reliability");
app.commandLine.appendSwitch("disable-features", "MediaRouter,OptimizationHints,Translate");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#141414",
    show: true,
    icon: path.join(__dirname, "..", "public", "icons", "icon-512.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.removeMenu();
  void win.loadFile(path.join(__dirname, "..", "dist-desktop", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
}

// "Salir" button in the workspace sidebar asks the main process to exit.
ipcMain.on("app-quit", () => app.quit());

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
