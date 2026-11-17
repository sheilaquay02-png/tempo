// Locally packages a throwaway, LOCAL-ONLY Windows QA executable.
// No build output is uploaded, published, signed or connected to hosted Tempo.
const fs=require("node:fs");
const path=require("node:path");
const os=require("node:os");

if(process.platform!=="win32") {
  throw new Error("For reliable packaging, run this QA command on a Windows computer (not a hosted Windows runner).");
}
const here=path.resolve(__dirname,"..");
const root=path.resolve(here,"..");
const stageRoot=fs.mkdtempSync(path.join(os.tmpdir(),"tempo-win-qa-"));
const stage=path.join(stageRoot,"app");
const destination=path.join(here,"out");
const version=require(path.join(here,"package.json")).devDependencies.electron;
if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error("Electron version must be pinned.");
fs.mkdirSync(path.join(stage,"public"),{recursive:true});
for(const file of ["main.cjs","preload.cjs","offline.html","qa-entry.cjs"]) {
  fs.copyFileSync(path.join(here,file),path.join(stage,file));
}
const icon=path.join(root,"public","icon-192.png");
if(!fs.existsSync(icon))throw new Error("Missing public/icon-192.png. Aborting QA build.");
fs.copyFileSync(icon,path.join(stage,"public","icon-192.png"));
fs.writeFileSync(path.join(stage,"package.json"),JSON.stringify({
  name:"mini-tempo-local-only-qa",
  version:"0.1.0",
  private:true,
  description:"Temporary local-only Windows QA; NOT a production release",
  main:"qa-entry.cjs"
},null,2));
const packager=require("@electron/packager");
(async()=>{
  try {
    const outputs=await packager({
      dir:stage,
      name:"MiniTempo-LocalQA",
      executableName:"MiniTempo-LocalQA",
      platform:"win32",
      arch:"x64",
      electronVersion:version,
      out:destination,
      overwrite:true,
      prune:true,
      asar:true,
    });
    for(const folder of outputs) {
      const exe=path.join(folder,"MiniTempo-LocalQA.exe");
      if(!fs.existsSync(exe))throw new Error("Windows QA executable missing in "+folder);
      const file=path.join(folder,"READ_THIS_FIRST.txt");
      fs.writeFileSync(file,[
        "MINI TEMPO - LOCAL-ONLY TEST BUILD",
        "This is NOT an installer or production release.",
        "It only connects to http://localhost:3000.",
        "The test server must return a valid disposable-local Supabase QA check.",
        "Start the local Supabase stack and Next.js with TEMPO_QA_LOCAL_ONLY=1.",
        "Use only fake test accounts and transactions.",
        "Do not distribute, upload, merge, or connect this to real Budget data.",
        "Nothing is installed system-wide. Delete this folder after testing.",
      ].join("\r\n"));
      process.stdout.write("Local-only QA package prepared in "+folder+"\n");
    }
  } finally {
    fs.rmSync(stageRoot,{recursive:true,force:true});
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
