const { contextBridge, ipcRenderer } = require("electron");

// Expose only narrowly scoped desktop actions. Never expose Node or arbitrary IPC.
contextBridge.exposeInMainWorld("tempoDesktop", Object.freeze({
  openFull: path => ipcRenderer.invoke("tempo:open-full", typeof path === "string" ? path : "/"),
  openExpense: () => ipcRenderer.invoke("tempo:open-expense"),
  hideMini: () => ipcRenderer.invoke("tempo:hide-mini"),
  minimizeMini: () => ipcRenderer.invoke("tempo:minimize-mini"),
  setAlwaysOnTop: value => ipcRenderer.invoke("tempo:pin-mini", Boolean(value)),
  getMiniState: () => ipcRenderer.invoke("tempo:mini-state"),
  expenseSaved: () => ipcRenderer.invoke("tempo:expense-saved"),
  closeExpense: quit => ipcRenderer.invoke("tempo:close-expense",Boolean(quit)),
  onRequestClose: handler => { const listener=(_event,quit)=>handler(Boolean(quit)); ipcRenderer.on("tempo:request-close",listener); return ()=>ipcRenderer.removeListener("tempo:request-close",listener); },
  focusMini: () => ipcRenderer.invoke("tempo:focus-mini"),
}));
