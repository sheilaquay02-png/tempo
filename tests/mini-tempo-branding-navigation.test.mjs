import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import iconHelper from "../desktop/scripts/windows-icon.cjs";

const read = file => readFileSync(file, "utf8");

test("Mini Tempo uses Full Tempo typography, theme tokens and shared logo mark", () => {
  const miniStyles = read("styles/miniTempoReleaseStyles.js");
  const fullStyles = read("styles/tempoStyles.js");
  const miniPanel = read("components/mini/MiniTempoPanel.jsx");
  const app = read("components/TempoApp.jsx");
  assert.match(fullStyles, /--font:'Nunito',sans-serif/);
  assert.match(fullStyles, /--accent/);
  assert.match(miniStyles, /font-family:var\(--font\)/);
  assert.match(miniStyles, /font-size:calc\(var\(--fs\)\*14px\)/);
  for (const token of ["--bg", "--bg2", "--bg3", "--text", "--text2", "--border", "--accent", "--surface", "--shadow-sm"]) {
    assert.ok(miniStyles.includes(`var(${token})`), `Missing Full Tempo theme token ${token}`);
  }
  assert.match(miniPanel, /import \{ TempoLogoMark \} from "\.\.\/shared\/DisplayComponents"/);
  assert.match(miniPanel, /<TempoLogoMark \/>/);
  assert.match(app, /tempoMobileFooterPopupSafetyCSS \+ miniTempoCSS/);
  assert.doesNotMatch(miniPanel, /expense recorder|budget recorder/i);
});

test("Planning navigation disappears only from the Full Tempo sidebar", () => {
  const shell = read("components/layout/AppShell.jsx");
  const navStart = shell.indexOf('<nav className="sidebar-nav">');
  const navEnd = shell.indexOf("</nav>", navStart);
  assert.ok(navStart >= 0 && navEnd > navStart, "Sidebar navigation must exist");
  const nav = shell.slice(navStart, navEnd);
  assert.doesNotMatch(nav, />Planning</);
  assert.doesNotMatch(nav, /desktop-hidden-menu-item.*Plan Today/);
  for (const item of ["Today", "Calendar", "Tasks", "Rhythm Stats", "Settings"]) {
    assert.ok(nav.includes(item), `Essential nav item ${item} must remain`);
  }
  assert.match(shell, /className="topbar-btn plan-day-btn"/);
  assert.match(read("components/today/TodayDashboard.jsx"), /onClick=\{onPlanToday\}>✨ Plan Today/);
});

test("Windows executable icon is a valid ICO derived from Tempo's existing PNG", () => {
  const png = readFileSync("public/icon-192.png");
  const { width, height } = iconHelper.pngDimensions(png);
  assert.equal(width, height);
  const ico = iconHelper.icoFromPng(png);
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 1);
  assert.equal(ico.readUInt8(6), width === 256 ? 0 : width);
  assert.equal(ico.readUInt8(7), height === 256 ? 0 : height);
  assert.equal(ico.readUInt32LE(14), png.length);
  assert.equal(ico.readUInt32LE(18), 22);
  assert.ok(ico.subarray(22).equals(png), "Original PNG bytes must be embedded intact");
  const packaging = read("desktop/scripts/package-windows-personal.cjs");
  assert.match(packaging, /writeWindowsIcoFromPng\(icon,/);
  assert.match(packaging, /icon:executableIcon/);
  assert.match(packaging, /TEMPO_PERSONAL_PACKAGE_APPROVED/);
  assert.match(packaging, /TEMPO_PERSONAL_ORIGIN/);
});
