import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {EventEmitter} from "node:events";
import {createRequire} from "node:module";
import vm from "node:vm";
import path from "node:path";

// Electron main-process integration test using fake BrowserWindow/WebContents.
// No Electron install, production deployment, network calls or Windows runner.
// Behaves as an actual app process in the Window/IPC lifecycle.
const nativeRequire=createRequire(import.meta.url);
const mainSource=readFileSync("desktop/main.cjs","utf8");

async function mockDesktop({savedState=null,qaMode=false,qaReady=true}={}) {
  const windows=[],openedExternal=[];
  const handlers=new Map();
  let tray, networkPolicy;
  let persisted=savedState?JSON.stringify(savedState):null;
  class FakeWebContents extends EventEmitter {
    constructor() {super();this.openHandler=null;this.sent=[];this.reloadCalls=0;}
    setWindowOpenHandler(fn){this.openHandler=fn;}
    send(...params){this.sent.push(params);}
    reloadIgnoringCache(){this.reloadCalls++;}
  }
  class FakeWindow extends EventEmitter {
    constructor(options){
      super();this.options=options;this.bounds={x:100,y:100,width:options.width||360,height:options.height||520};
      this.pinned=Boolean(options.alwaysOnTop);this.visible=false;this.destroyed=false;this.minimized=false;
      this.loadCalls=[];this.fileCalls=[];this.focusCount=0;this.webContents=new FakeWebContents();
      windows.push(this);
    }
    loadURL(url){this.loadCalls.push(url);return Promise.resolve();}
    loadFile(path){this.fileCalls.push(path);return Promise.resolve();}
    show(){this.visible=true;}
    hide(){this.visible=false;}
    focus(){this.focusCount++;}
    minimize(){this.minimized=true;}
    isMinimized(){return this.minimized;}
    restore(){this.minimized=false;}
    setAlwaysOnTop(value){this.pinned=Boolean(value);}
    isAlwaysOnTop(){return this.pinned;}
    getBounds(){return {...this.bounds};}
    isDestroyed(){return this.destroyed;}
    close(){
      let prevented=false;
      this.emit("close",{preventDefault(){prevented=true;}});
      if(prevented)return false;
      this.destroyed=true;this.emit("closed");return true;
    }
  }
  class FakeTray extends EventEmitter{
    constructor(icon){super();this.icon=icon;tray=this;}
    setToolTip(value){this.tooltip=value;}
    setContextMenu(items){this.menu=items;}
  }
  class FakeApp extends EventEmitter {
    constructor(){super();this.exited=false;this.autoStart=false;this.quitAttempts=0;}
    requestSingleInstanceLock(){return true;}
    whenReady(){return Promise.resolve();}
    getPath(name){assert.equal(name,"userData");return "/tmp/tempo-phase3-mock";}
    getLoginItemSettings(){return {openAtLogin:this.autoStart};}
    setLoginItemSettings({openAtLogin}){this.autoStart=Boolean(openAtLogin);}
    quit(){
      this.quitAttempts++;
      let prevented=false;
      this.emit("before-quit",{preventDefault(){prevented=true;}});
      if(!prevented){this.exited=true;}
    }
  }
  const app=new FakeApp();
  const ipcMain={handle:(name,callback)=>{if(handlers.has(name))throw Error("duplicate IPC handler");handlers.set(name,callback);}};
  const fsMock={
    readFileSync:()=>{if(!persisted)throw Error("ENOENT");return persisted;},
    mkdirSync:()=>{},
    writeFileSync:(_file,content)=>{persisted=String(content);}
  };
  const electron={app,BrowserWindow:FakeWindow,ipcMain,Tray:FakeTray,Menu:{buildFromTemplate:items=>items},
    screen:{getAllDisplays:()=>[{workArea:{x:0,y:0,width:1920,height:1080}}]},
    shell:{openExternal:url=>{openedExternal.push(url);return Promise.resolve();}},
    session:{fromPartition:partition=>({
      webRequest:{onBeforeRequest:(_filter,policy)=>{
        assert.equal(partition,"persist:tempo");
        networkPolicy=policy;
      }}
    })}};
  const localRequire=name=>name==="electron"?electron:name==="node:fs"?fsMock:nativeRequire(name);
  const mockEnv=qaMode
    ? {TEMPO_QA_LOCAL_ONLY:"1",TEMPO_DEV:"1",TEMPO_DESKTOP_URL:"https://live.invalid"}
    : {TEMPO_DEV:"1",TEMPO_DESKTOP_URL:"http://localhost:3000"};
  const context={
    require:localRequire,process:{env:mockEnv},URL,AbortSignal,
    fetch:async (_url,_options)=>({ok:qaReady,json:async()=>({localQa:qaReady})}),
    __dirname:"/repo/desktop"
  };
  vm.runInNewContext(mainSource,context,{filename:"desktop/main.cjs"});
  for(let i=0;i<8;i++)await Promise.resolve();
  function ipc(name,sender,...args){
    const callback=handlers.get(name);
    assert.ok(callback,`Missing IPC handler: ${name}`);
    return callback({sender:sender.webContents},...args);
  }
  const windowsOf=title=>windows.filter(x=>x.options.title===title);
  return {app,windows,windowsOf,ipc,handlers,openedExternal,
    get networkPolicy(){return networkPolicy;},
    get tray(){return tray;},get saved(){return persisted?JSON.parse(persisted):null;}};
}

test("Portable QA executable ignores a production URL override and requires local readiness",async()=>{
  const env=await mockDesktop({qaMode:true,qaReady:true});
  const mini=env.windowsOf("Mini Tempo")[0];
  assert.deepEqual(mini.loadCalls,["http://localhost:3000/mini"]);
  assert.equal(typeof env.networkPolicy,"function");
  function denied(url) {
    let answer;
    env.networkPolicy({url},result=>{answer=result;});
    return answer.cancel;
  }
  assert.equal(denied("https://zyrxfrmkvqwtxffzgvtj.supabase.co/rest/v1/user_data"),true);
  assert.equal(denied("https://example.com/tracker"),true);
  assert.equal(denied("http://127.0.0.1:3000/mini"),false);
  assert.equal(denied("http://127.0.0.1:54321/auth/v1/health"),false);
  assert.equal(denied("ws://127.0.0.1:54321/realtime/v1/websocket"),false);
  assert.equal(denied("http://127.0.0.1:54322/"),true);
  assert.equal(denied("file:///untrusted/offline.html"),true);
  assert.equal(denied(new URL("file://" + path.join("/repo/desktop","offline.html").replaceAll("\\","/")).href),false);
  assert.equal(denied("data:image/png;base64,AAAA"),false);
  assert.equal(mini.webContents.openHandler({url:"https://example.com"}).action,"deny");
  assert.deepEqual(env.openedExternal,[],"Local QA must never launch a hosted website");
});
test("Portable QA refuses to display an app without the disposable Supabase sentinel",async()=>{
  const env=await mockDesktop({qaMode:true,qaReady:false});
  const mini=env.windowsOf("Mini Tempo")[0];
  assert.deepEqual(mini.loadCalls,[]);
  assert.equal(mini.tempoOfflineShown,true);
  assert.equal(mini.fileCalls.length,1);
});
test("Mini opens once, supports tray hide/reopen and never duplicates on second instance",async()=>{
  const env=await mockDesktop(),mini=env.windowsOf("Mini Tempo")[0];
  assert.equal(env.windowsOf("Mini Tempo").length,1);
  assert.deepEqual(mini.loadCalls,["http://localhost:3000/mini"]);
  assert.equal(mini.options.minWidth,330);
  assert.equal(mini.options.minHeight,420);
  mini.close();
  assert.equal(mini.destroyed,false);
  assert.equal(mini.visible,false);
  env.app.emit("second-instance");
  assert.equal(env.windowsOf("Mini Tempo").length,1);
  assert.equal(mini.visible,true);
  assert.ok(mini.focusCount>=1);
  assert.ok(env.tray.menu.some(x=>x.label==="Quit Tempo"));
});

test("Pin preference is persisted and accessible to Mini only",async()=>{
  const env=await mockDesktop(),mini=env.windowsOf("Mini Tempo")[0];
  assert.equal(env.ipc("tempo:mini-state",mini).alwaysOnTop,false);
  assert.equal(env.ipc("tempo:pin-mini",mini,true),true);
  assert.equal(env.saved.alwaysOnTop,true);
  assert.equal(env.ipc("tempo:mini-state",mini).alwaysOnTop,true);
  assert.ok(env.saved.bounds.width>=330);
});

test("Restores off-screen Mini bounds to a usable current-screen fallback",async()=>{
  const env=await mockDesktop({savedState:{bounds:{x:98000,y:44000,width:360,height:520},alwaysOnTop:true}});
  const mini=env.windowsOf("Mini Tempo")[0];
  assert.equal(mini.pinned,true);
  assert.equal(mini.options.width,360);
  assert.equal(mini.options.height,520);
  assert.equal(mini.options.x,undefined);
});

test("Mini and Full share a secure auth partition without an expense window",async()=>{
  const env=await mockDesktop(),mini=env.windowsOf("Mini Tempo")[0];
  env.ipc("tempo:open-full",mini,"/?page=tasks");
  env.ipc("tempo:open-full",mini,"/?page=calendar");
  assert.equal(env.windowsOf("Tempo").length,1);
  assert.equal(env.windowsOf("Record expense").length,0);
  assert.equal(env.handlers.has("tempo:open-expense"),false);
  assert.equal(env.tray.menu.some(x=>x.label==="Record Expense"),false);
  const full=env.windowsOf("Tempo")[0];
  assert.ok(full.loadCalls.at(-1).includes("/?page=calendar"));
  for(const win of [mini,full]){
    assert.equal(win.options.webPreferences.partition,"persist:tempo");
    assert.equal(win.options.webPreferences.nodeIntegration,false);
    assert.equal(win.options.webPreferences.sandbox,true);
    assert.equal(win.options.webPreferences.contextIsolation,true);
  }
});

test("Main-process navigation guards prevent redirects and deny IPC from unknown windows",async()=>{
  const env=await mockDesktop(),mini=env.windowsOf("Mini Tempo")[0];
  env.ipc("tempo:open-full",mini,"//evil.example");
  const full=env.windowsOf("Tempo")[0];
  assert.equal(full.loadCalls.at(-1),"http://localhost:3000/");
  assert.throws(()=>env.ipc("tempo:hide-mini",full),/not permitted/);
  let prevented=false;
  full.webContents.emit("will-navigate",{preventDefault(){prevented=true;}},"https://evil.example/fake-login");
  assert.equal(prevented,true);
  assert.deepEqual(env.openedExternal,["https://evil.example/fake-login"]);
  assert.equal(full.webContents.openHandler({url:"https://evil.example/"}).action,"deny");
});

test("Cold offline start shows non-financial recovery and retries the same internal route",async()=>{
  const env=await mockDesktop(),mini=env.windowsOf("Mini Tempo")[0];
  mini.webContents.emit("did-fail-load",{},-105,"ERR_NAME_NOT_RESOLVED",
    "http://localhost:3000/mini",true);
  assert.equal(mini.fileCalls.length,1);
  assert.ok(mini.fileCalls[0].replaceAll("\\","/").endsWith("desktop/offline.html"));
  assert.equal(mini.visible,true);
  assert.equal(mini.tempoOfflineShown,true);
  mini.webContents.emit("did-fail-load",{},-105,"ERR_NAME_NOT_RESOLVED",
    "http://localhost:3000/mini",true);
  assert.equal(mini.fileCalls.length,1,"Offline page is not recursively loaded");
  env.ipc("tempo:retry-window",mini);
  assert.equal(mini.loadCalls.at(-1),"http://localhost:3000/mini");
  assert.equal(mini.tempoOfflineShown,false);
  const html=readFileSync("desktop/offline.html","utf8");
  assert.match(html,/full offline restart is not supported yet/);
  assert.match(html,/retryWindow/);
});

test("Tray quit exits cleanly without an expense recorder",async()=>{
  const env=await mockDesktop();
  const launch=env.tray.menu.find(x=>x.label==="Launch at login");
  assert.equal(launch.checked,false);
  launch.click({checked:true});
  assert.equal(env.app.autoStart,true);
  env.tray.menu.find(x=>x.label==="Quit Tempo").click();
  assert.equal(env.app.exited,true);
  assert.equal(env.windowsOf("Record expense").length,0);
});
