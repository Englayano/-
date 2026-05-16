const path = require("node:path");
const { app, BrowserWindow, Notification, dialog, ipcMain, globalShortcut } = require("electron");
const isDev = require("electron-is-dev");
const db = require("./database.cjs");

let mainWindow;

function createWindow() {
  db.ensureDb(app);
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "مذكرة",
    backgroundColor: "#fbf7ef",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }
}

function sendShortcut(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("shortcut", action);
  }
}

function registerShortcuts() {
  globalShortcut.register("CommandOrControl+N", () => sendShortcut("new-task"));
  globalShortcut.register("CommandOrControl+Shift+N", () => sendShortcut("new-note"));
  globalShortcut.register("CommandOrControl+F", () => sendShortcut("search"));
  globalShortcut.register("Delete", () => sendShortcut("delete-selected"));
}

function setupIpc() {
  ipcMain.handle("tasks:list", () => db.listTasks());
  ipcMain.handle("tasks:create", (_event, task) => db.createTask(task));
  ipcMain.handle("tasks:update", (_event, id, task) => db.updateTask(id, task));
  ipcMain.handle("tasks:delete", (_event, id) => db.deleteTask(id));
  ipcMain.handle("tasks:set-focus", (_event, id) => db.setFocusTask(id));
  ipcMain.handle("dashboard:get", () => db.dashboard());

  ipcMain.handle("notes:list", () => db.listNotes());
  ipcMain.handle("notes:create", (_event, note) => db.createNote(note));
  ipcMain.handle("notes:update", (_event, id, note) => db.updateNote(id, note));
  ipcMain.handle("notes:delete", (_event, id) => db.deleteNote(id));

  ipcMain.handle("settings:get", () => db.getSettings());
  ipcMain.handle("settings:set", (_event, key, value) => db.setSetting(key, value));

  ipcMain.handle("attachments:pick", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
    });
    if (result.canceled) return [];
    return result.filePaths.map((filePath) => {
      const stats = require("node:fs").statSync(filePath);
      return {
        file_name: path.basename(filePath),
        file_path: filePath,
        file_size: stats.size,
      };
    });
  });

  ipcMain.handle("notifications:check-due-tasks", () => {
    const tasks = db.dueTasksForNotification();
    if (Notification.isSupported() && tasks.length > 0) {
      const overdue = tasks.filter((task) => task.end_date && new Date(task.end_date) < new Date());
      new Notification({
        title: overdue.length ? "مهام متأخرة" : "مهام قريبة",
        body: overdue.length
          ? `لديك ${overdue.length} مهام متأخرة تحتاج انتباهك.`
          : `لديك ${tasks.length} مهام ينتهي موعدها خلال 4 أيام.`,
      }).show();
    }
    return tasks;
  });
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();
  registerShortcuts();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
