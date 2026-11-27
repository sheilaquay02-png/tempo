import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

// The journal is retired and its sticker/background art (~61 MB) was removed from public/,
// so it no longer ships with every deployment. Nothing in the live app loads it.
test("retired journal art stays out of public/", () => {
  assert.equal(existsSync("public/memory-assets"), false, "public/memory-assets should stay removed");
});
