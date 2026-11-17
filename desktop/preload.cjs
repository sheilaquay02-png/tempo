const { contextBridge, ipcRenderer } = require("electron");

// Expose only narrowly scoped desktop actions. Never expose Node or arbitrary IPC.
contextBridge.exposeInMainWorld("tempoDesktop", Object.freeze({
  openFull: path => ipcRenderer.invoke("tempo:open-full", typeof path === "string" ? path : "/"),
  openExpense: () => ipcRenderer.invoke("tempo:open-expense"),
  hideMini: () => ipcRenderer.invoke("tempo:hide-mini"),
  minimizeMini: () => ipcRenderer.invoke("tempo:minimize-mini"),
  setAlwaysOnTop: value => ipcRenderer.invoke("tempo:pin-mini", Boolean(value)),
  expenseSaved: () => ipcRenderer.invoke("tempo:expense-saved"),
  closeExpense: () => ipcRenderer.invoke("tempo:close-expense"),
  focusMini: () => ipcRenderer.invoke("tempo:focus-mini"),
}));
