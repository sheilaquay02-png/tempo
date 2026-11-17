const { app, BrowserWindow, ipcMain, Tray, Menu, screen, shell } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

let mini = null;
let full = null;
let expense = null;
let tray = null;
let quitting = false;
let expenseCanClose = false;

const devMode = process.env.TEMPO_DEV === "1";
const rawOrigin = process.env.TEMPO_DESKTOP_URL || (devMode ? "http://localhost:3000" : "");
if (!rawOrigin) throw new Error("Set TEMPO_DESKTOP_URL to the HTTPS URL of your approved Tempo deployment. No deployment is bundled with the shell.");
const url = new URL(rawOrigin);
if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("TEMPO_DESKTOP_URL must be an origin only.");
if (url.protocol !== "https:" && !(devMode && url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname))) {
  throw new Error("Tempo desktop requires HTTPS, except localhost development.");
}
const base = url.origin;
const stateFile = () => path.join(app.getPath("userData"), "tempo-mini-window.json");
function readState() {
  try { return JSON.parse(fs.readFileSync(stateFile(),"utf8")); } catch { return {}; }
}
function writeState(data) {
  try { fs.mkdirSync(path.dirname(stateFile()),{recursive:true}); fs.writeFileSync(stateFile(),JSON.stringify(data)); } catch {}
}
function safeBounds(bounds, fallback) {
  if (!bounds || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y) || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return fallback;
  const wanted = {x:bounds.x,y:bounds.y,width:Math.max(330,Math.min(900,bounds.width)),height:Math.max(420,Math.min(1100,bounds.height))};
  const displays = screen.getAllDisplays();
  const inside = displays.some(({workArea}) => wanted.x+80 >= workArea.x && wanted.y+60 >= workArea.y && wanted.x < workArea.x+workArea.width && wanted.y < workArea.y+workArea.height);
  return inside ? wanted : fallback;
}
function appPath(route) {
  // Internal navigation only; callers cannot navigate windows to another origin.
  if (typeof route !== "string" || !route.startsWith("/") || route.startsWith("//") || route.includes("\\") || route.includes("#")) return base+"/";
  const target = new URL(route,base);
  return target.origin === base ? target.href : base+"/";
}
function allowedNavigation(target) {
  try { const next = new URL(target); return next.origin === base; } catch { return false; }
}
function secureWindow(win) {
  win.webContents.setWindowOpenHandler(({url: destination}) => {
    // External links open in the user's default browser, not a privileged app window.
    if (destination.startsWith("https://") && !allowedNavigation(destination)) shell.openExternal(destination).catch(()=>{});
    return {action:"deny"};
  });
  win.webContents.on("will-navigate",(event,destination)=>{
    if (!allowedNavigation(destination)) {event.preventDefault(); if(destination.startsWith("https://")) shell.openExternal(destination).catch(()=>{});}
  });
}
function makeWindow(options, route) {
  const win = new BrowserWindow({
    ...options,
    show:false,
    backgroundColor:"#fffaf7",
    webPreferences:{
      preload:path.join(__dirname,"preload.cjs"),
      partition:"persist:tempo",
      nodeIntegration:false,
      contextIsolation:true,
      sandbox:true,
      webSecurity:true,
    }
  });
  secureWindow(win);
  win.loadURL(appPath(route));
  win.once("ready-to-show",()=>{if(!win.isDestroyed())win.show();});
  return win;
}
function openMini() {
  if (mini && !mini.isDestroyed()) { mini.show(); mini.focus(); return mini; }
  const last=readState();
  mini=makeWindow({
    ...safeBounds(last.bounds,{width:360,height:520}),
    minWidth:330,minHeight:420,frame:false,transparent:false,resizable:true,
    title:"Mini Tempo",alwaysOnTop:Boolean(last.alwaysOnTop),
  },"/mini");
  mini.on("close",e=>{if(!quitting){e.preventDefault();mini.hide();}});
  const savePosition=()=>{
    if(!mini || mini.isDestroyed() || mini.isMinimized()) return;
    writeState({bounds:mini.getBounds(),alwaysOnTop:mini.isAlwaysOnTop()});
  };
  mini.on("move",savePosition);mini.on("resize",savePosition);
  return mini;
}
function openFull(route="/") {
  if (!full || full.isDestroyed()) {
    full=makeWindow({width:1180,height:790,minWidth:720,minHeight:560,title:"Tempo"},"/");
    full.on("closed",()=>{full=null;});
  }
  if (full.isMinimized()) full.restore();
  full.show();full.focus();
  if(route!=="/")full.loadURL(appPath(route));
  return full;
}
function openExpense() {
  if (expense && !expense.isDestroyed()) {expense.show();expense.focus();return expense;}
  const parent=mini && !mini.isDestroyed() ? mini : full;
  expenseCanClose=false;
  expense=makeWindow({width:480,height:760,minWidth:420,minHeight:620,maxWidth:800,title:"Record expense",parent:parent||undefined},"/recorder");
  expense.on("close",e=>{if(!quitting&&!expenseCanClose){e.preventDefault();expense.webContents.send("tempo:request-close",false);}});
  expense.on("closed",()=>{expense=null;expenseCanClose=false;});
  return expense;
}
function senderRole(event) {
  if (mini && !mini.isDestroyed() && event.sender===mini.webContents) return "mini";
  if (full && !full.isDestroyed() && event.sender===full.webContents) return "full";
  if (expense && !expense.isDestroyed() && event.sender===expense.webContents) return "expense";
  return "unknown";
}
function requireRole(event,allowed) { if(!allowed.includes(senderRole(event)))throw new Error("Window action not permitted."); }
ipcMain.handle("tempo:open-full",(event,route)=>{requireRole(event,["mini","full","expense"]);openFull(route);return true;});
ipcMain.handle("tempo:open-expense",event=>{requireRole(event,["mini","full"]);openExpense();return true;});
ipcMain.handle("tempo:hide-mini",event=>{requireRole(event,["mini"]);mini.hide();return true;});
ipcMain.handle("tempo:minimize-mini",event=>{requireRole(event,["mini"]);mini.minimize();return true;});
ipcMain.handle("tempo:pin-mini",(event,pinned)=>{requireRole(event,["mini"]);mini.setAlwaysOnTop(Boolean(pinned));writeState({bounds:mini.getBounds(),alwaysOnTop:mini.isAlwaysOnTop()});return mini.isAlwaysOnTop();});
ipcMain.handle("tempo:expense-saved",event=>{requireRole(event,["expense"]);expenseCanClose=true;if(expense&&!expense.isDestroyed())expense.close();if(mini&&!mini.isDestroyed()){mini.show();mini.focus();mini.webContents.reloadIgnoringCache();}return true;});
ipcMain.handle("tempo:close-expense",(event,quit)=>{requireRole(event,["expense"]);expenseCanClose=true;if(expense&&!expense.isDestroyed())expense.close();if(quit){quitting=true;app.quit();}return true;});
ipcMain.handle("tempo:focus-mini",event=>{requireRole(event,["expense","full","mini"]);openMini();return true;});
if(!app.requestSingleInstanceLock()){app.quit();}else{
  app.on("second-instance",()=>openMini());
  app.whenReady().then(()=>{
    tray=new Tray(path.join(__dirname,"..","public","icon-192.png"));
    tray.setToolTip("Tempo");
    tray.setContextMenu(Menu.buildFromTemplate([
      {label:"Open Mini Tempo",click:()=>openMini()},
      {label:"Open Full Tempo",click:()=>openFull()},
      {label:"Record Expense",click:()=>openExpense()},
      {type:"separator"},
      {label:"Launch at login",type:"checkbox",checked:app.getLoginItemSettings().openAtLogin,click:item=>{app.setLoginItemSettings({openAtLogin:item.checked});}},
      {label:"Quit Tempo",click:()=>{if(expense&&!expense.isDestroyed()){expense.show();expense.focus();expense.webContents.send("tempo:request-close",true);}else{quitting=true;app.quit();}}}
    ]));
    tray.on("double-click",()=>openMini());
    openMini();
  });
  app.on("activate",()=>openMini());
  app.on("before-quit",()=>{quitting=true;});
  app.on("window-all-closed",()=>{ /* Keep tray app running on Windows */ });
}
