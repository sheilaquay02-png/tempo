import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {GET} from "../app/api/tempo-qa-status/route.js";

const read=path=>readFileSync(path,"utf8");

test("QA sentinel accepts only development mode explicitly pointing to local Supabase",async()=>{
  const vars=["NODE_ENV","TEMPO_QA_LOCAL_ONLY","NEXT_PUBLIC_SUPABASE_URL"];
  const previous=Object.fromEntries(vars.map(k=>[k,process.env[k]]));
  try {
    process.env.NODE_ENV="development";
    process.env.TEMPO_QA_LOCAL_ONLY="1";
    process.env.NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321";
    let response=GET();
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{localQa:true});
    process.env.NEXT_PUBLIC_SUPABASE_URL="https://zyrxfrmkvqwtxffzgvtj.supabase.co";
    response=GET();
    assert.equal(response.status,404);
    assert.deepEqual(await response.json(),{localQa:false});
    process.env.NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321";
    process.env.NODE_ENV="production";
    response=GET();
    assert.equal(response.status,404);
    process.env.NODE_ENV="development";
    delete process.env.TEMPO_QA_LOCAL_ONLY;
    response=GET();
    assert.equal(response.status,404);
  }finally{
    for(const key of vars){
      if(previous[key]===undefined)delete process.env[key];
      else process.env[key]=previous[key];
    }
  }
});

test("Portable QA forces localhost, never packages production secrets or deploys anything",()=>{
  const qa=read("desktop/qa-entry.cjs");
  const packageScript=read("desktop/scripts/package-windows-qa.cjs");
  const main=read("desktop/main.cjs");
  const pkg=JSON.parse(read("desktop/package.json"));
  assert.match(qa,/TEMPO_QA_LOCAL_ONLY="1"/);
  assert.match(qa,/TEMPO_DESKTOP_URL="http:\/\/127\.0\.0\.1:3000"/);
  assert.match(main,/qaServerReady\(\)/);
  assert.match(main,/webRequest\.onBeforeRequest/);
  assert.match(main,/cancel:!\(permitted\|\|staticOffline\)/);
  assert.match(pkg.scripts["package:windows:qa"],/package-windows-qa/);
  assert.equal(pkg.devDependencies["@electron/packager"],"20.3.0");
  assert.equal(pkg.devDependencies.electron,"45.3.3");
  assert.match(packageScript,/if\(process\.platform!=="win32"\)/);
  assert.match(packageScript,/platform:"win32"/);
  assert.match(packageScript,/arch:"x64"/);
  assert.match(packageScript,/qa-entry\.cjs/);
  assert.match(packageScript,/private:true/);
  assert.match(packageScript,/fs\.mkdtempSync/);
  assert.doesNotMatch(packageScript,/upload-artifact|github\.com\/releases|supabase link|db push|netlify deploy|vercel deploy/);
  assert.equal(existsSync("public/icon-192.png"),true);
  for(const file of ["desktop/qa-entry.cjs","desktop/scripts/package-windows-qa.cjs"]){
    execFileSync(process.execPath,["--check",file]);
  }
});
