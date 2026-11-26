// Personal Windows build: loads only the HTTPS origin approved at packaging time.
// Never treat this file as a local QA entrypoint.
const fs = require("node:fs");
const path = require("node:path");
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "desktop-origin.json"), "utf8"));
const origin = new URL(config.origin);
if (origin.protocol !== "https:" || origin.username || origin.password ||
    origin.pathname !== "/" || origin.search || origin.hash) {
  throw new Error("Mini Tempo personal build requires an approved HTTPS origin.");
}
process.env.TEMPO_QA_LOCAL_ONLY = "0";
process.env.TEMPO_DEV = "0";
process.env.TEMPO_DESKTOP_URL = origin.origin;
require("./main.cjs");
