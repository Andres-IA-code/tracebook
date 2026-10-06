const { app, BrowserWindow, shell, ipcMain, session } = require("electron");
const path = require("node:path");

// Fixed internal id: data folder stays the same even if the visible product name changes.
app.setName("pentest-reports-desktop");
app.setPath("userData", path.join(app.getPath("appData"), "pentest-reports-desktop"));

// Fully local app: skip Chromium services that would otherwise contact the network.
app.commandLine.appendSwitch("disable-background-networking");
app.commandLine.appendSwitch("disable-component-update");
app.commandLine.appendSwitch("disable-default-apps");
app.commandLine.appendSwitch("disable-domain-reliability");
app.commandLine.appendSwitch("disable-features", "MediaRouter,OptimizationHints,Translate");

const INDEX = path.join(__dirname, "..", "dist-desktop", "index.html");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#ECE7DD",
    icon: path.join(__dirname, "..", "public", "icons", "icon-512.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  win.removeMenu();
  void win.loadFile(INDEX);
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      if (/^https?:/.test(url)) void shell.openExternal(url);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.on("app-quit", () => app.quit());

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
