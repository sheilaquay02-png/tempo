import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const read = p => readFileSync(p, "utf8");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

test("Classic and Mini never import the world prototype or three.js", () => {
  const files = [...walk("components"), ...walk("app"), ...walk("hooks"), ...walk("lib"), ...walk("utils")]
    .filter(p => !p.startsWith(join("components", "world")) && !p.startsWith(join("app", "world-lab")));
  for (const f of files) {
    const src = read(f);
    assert.ok(!/from\s+["'][^"']*components\/world|from\s+["']\.{1,2}\/world\//.test(src), `${f} imports components/world`);
    assert.ok(!/["'](three|@react-three\/fiber|@react-three\/drei)["']/.test(src), `${f} imports three.js`);
  }
});

test("/world-lab loads the world only in the browser", () => {
  const page = read("app/world-lab/page.js");
  assert.match(page, /WorldLabLoader/);
  assert.match(page, /index:\s*false/);
  const loader = read("components/world/WorldLabLoader.jsx");
  assert.match(loader, /dynamic\(\(\) => import\("\.\/WorldLab"\)/);
  assert.match(loader, /ssr:\s*false/);
  const lab = read("components/world/WorldLab.jsx");
  assert.match(lab, /dynamic\(\(\) => import\("\.\/Room3D"\)/, "3D room is loaded on demand");
  assert.ok(!/import\s+Room3D\s+from/.test(lab), "3D room must not be imported eagerly");
});

test("the world prototype uses pretend data only", () => {
  for (const f of walk(join("components", "world"))) {
    const src = read(f);
    assert.ok(!/supabase|cloudSync|useTempoCloudSync|TempoApp|lib\/tempo/i.test(src), `${f} touches real data code`);
  }
});

test("3D room renders on demand, caps pixel density and has a fallback", () => {
  const src = read("components/world/Room3D.jsx");
  assert.match(src, /frameloop="demand"/);
  assert.match(src, /dpr=\{\[1, 1\.75\]\}/);
  assert.match(src, /hasWebGL/);
  assert.match(src, /getDerivedStateFromError/);
});

test("animations respect reduced motion", () => {
  assert.match(read("components/world/world-lab.css"), /prefers-reduced-motion:\s*reduce/);
});

test("3D libraries are pinned to exact versions", () => {
  const pkg = JSON.parse(read("package.json"));
  for (const name of ["three", "@react-three/fiber", "@react-three/drei"]) {
    assert.match(pkg.dependencies[name], /^\d+\.\d+\.\d+$/, `${name} is pinned`);
  }
});
