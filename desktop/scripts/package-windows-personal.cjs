// Packages a portable personal Windows Electron shell, not a hosted deployment.
// The approved HTTPS origin must be supplied intentionally at packaging time.
// Does not bundle Next.js, Supabase credentials, financial data or an installer.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { writeWindowsIcoFromPng } = require("./windows-icon.cjs");
if (process.platform !== "win32") throw new Error("Package on the intended Windows PC.");
if (process.env.TEMPO_PERSONAL_PACKAGE_APPROVED !== "YES") {
  throw new Error("Set TEMPO_PERSONAL_PACKAGE_APPROVED=YES only after verifying the approved Tempo HTTPS site and /mini route.");
}
let origin;
try {
  const raw = process.env.TEMPO_PERSONAL_ORIGIN || "";
  origin = new URL(raw);
  if (origin.protocol !== "https:" || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash ||
      !origin.hostname || origin.hostname === "localhost") throw Error("Invalid origin");
} catch {
  throw new Error("Set TEMPO_PERSONAL_ORIGIN to your approved Tempo HTTPS origin, e.g. https://your-domain.example (no path).");
}
const here = path.resolve(__dirname,"..");
const root = path.resolve(here,"..");
const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(),"tempo-personal-"));
const stage = path.join(stageRoot,"app");
const destination = path.join(here,"out");
const version = require(path.join(here,"package.json")).devDependencies.electron;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error("Electron version must be pinned.");
(async()=>{
  try {
    fs.mkdirSync(path.join(stage,"public"),{recursive:true});
    for (const file of ["main.cjs","preload.cjs","offline.html","personal-entry.cjs"]) {
      fs.copyFileSync(path.join(here,file),path.join(stage,file));
    }
    const icon = path.join(root,"public","icon-192.png");
    if(!fs.existsSync(icon)) throw Error("Missing icon-192.png");
    fs.copyFileSync(icon,path.join(stage,"public","icon-192.png"));
    const executableIcon = writeWindowsIcoFromPng(icon, path.join(stageRoot, "tempo-windows.ico"));
    fs.writeFileSync(path.join(stage,"desktop-origin.json"),JSON.stringify({origin:origin.origin}));
    fs.writeFileSync(path.join(stage,"package.json"),JSON.stringify({
      name:"mini-tempo-personal",version:"0.1.0",private:true,
      description:"Personal portable Mini Tempo desktop companion",main:"personal-entry.cjs"
    },null,2));
    const {packager}=require("@electron/packager");
    const outputs=await packager({
      dir:stage,name:"MiniTempo-Personal",executableName:"MiniTempo-Personal",
      platform:"win32",arch:"x64",electronVersion:version,out:destination,
      icon:executableIcon,overwrite:true,prune:true,asar:true
    });
    for (const folder of outputs){
      if(!fs.existsSync(path.join(folder,"MiniTempo-Personal.exe")))throw Error("Executable missing: "+folder);
      fs.writeFileSync(path.join(folder,"READ_ME.txt"),[
        "MINI TEMPO - PERSONAL PORTABLE BUILD",
        "Approved interface origin: "+origin.origin,
        "Windows executable icon: Tempo branding (from public/icon-192.png).",
        "This is an unsigned portable app, NOT an installer or offline-bundled app.",
        "The web-hosted /mini page must already be published and verified.",
        "This build does not include production API keys or a local database.",
        "Do not distribute. Windows SmartScreen may warn about unsigned software.",
        "Keep the entire folder together; open MiniTempo-Personal.exe.",
        "Offline cold-start still requires a network connection to load the interface."
      ].join("\r\n"));
      process.stdout.write("Portable personal package: "+folder+"\n");
    }
  } finally {fs.rmSync(stageRoot,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
