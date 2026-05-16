const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mudhakkirah", {
  tasks: {
    list: () => ipcRenderer.invoke("tasks:list"),
    create: (task) => ipcRenderer.invoke("tasks:create", task),
    update: (id, task) => ipcRenderer.invoke("tasks:update", id, task),
    delete: (id) => ipcRenderer.invoke("tasks:delete", id),
    setFocus: (id) => ipcRenderer.invoke("tasks:set-focus", id),
  },
  notes: {
    list: () => ipcRenderer.invoke("notes:list"),
    create: (note) => ipcRenderer.invoke("notes:create", note),
    update: (id, note) => ipcRenderer.invoke("notes:update", id, note),
    delete: (id) => ipcRenderer.invoke("notes:delete", id),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  },
  dashboard: () => ipcRenderer.invoke("dashboard:get"),
  attachments: {
    pick: () => ipcRenderer.invoke("attachments:pick"),
  },
  notifications: {
    checkDueTasks: () => ipcRenderer.invoke("notifications:check-due-tasks"),
  },
  shortcuts: {
    on: (callback) => {
      const listener = (_event, action) => callback(action);
      ipcRenderer.on("shortcut", listener);
      return () => ipcRenderer.removeListener("shortcut", listener);
    },
  },
});
