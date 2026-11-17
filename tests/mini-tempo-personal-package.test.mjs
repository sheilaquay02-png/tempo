import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";

test("Personal portable package is HTTPS-gated and never replaces localhost QA",()=>{
  const packageConfig=JSON.parse(readFileSync("desktop/package.json","utf8"));
  assert.equal(packageConfig.scripts["package:windows:qa"],"node scripts/package-windows-qa.cjs");
  assert.equal(packageConfig.scripts["package:windows:personal"],"node scripts/package-windows-personal.cjs");
  const script=readFileSync("desktop/scripts/package-windows-personal.cjs","utf8");
  const entry=readFileSync("desktop/personal-entry.cjs","utf8");
  for(const file of ["desktop/scripts/package-windows-personal.cjs","desktop/personal-entry.cjs"]) {
    execFileSync(process.execPath,["--check",file]);
  }
  assert.match(script,/TEMPO_PERSONAL_PACKAGE_APPROVED/);
  assert.match(script,/TEMPO_PERSONAL_ORIGIN/);
  assert.match(script,/origin\.protocol !== "https:"/);
  assert.match(script,/personal-entry\.cjs/);
  assert.doesNotMatch(script,/supabase\.co|SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(entry,/desktop-origin\.json/);
  assert.match(entry,/process\.env\.TEMPO_QA_LOCAL_ONLY = "0"/);
  assert.match(entry,/process\.env\.TEMPO_DEV = "0"/);
  assert.match(entry,/process\.env\.TEMPO_DESKTOP_URL = origin\.origin/);
  assert.doesNotMatch(entry,/https:\/\/[^"\s]+\.vercel\.app/);
});

test("Personal packaging refuses to run when not explicitly approved",async()=>{
  const result = await import("node:child_process").then(({spawnSync})=>spawnSync(
    process.execPath,["desktop/scripts/package-windows-personal.cjs"],
    {env:{...process.env,TEMPO_PERSONAL_PACKAGE_APPROVED:"",TEMPO_PERSONAL_ORIGIN:""},encoding:"utf8"}
  ));
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Package on the intended Windows PC|TEMPO_PERSONAL_PACKAGE_APPROVED/);
});
