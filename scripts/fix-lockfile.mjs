// Rewrites private sandbox registry URLs in bun.lock to the public npm registry.
import { readFileSync, writeFileSync } from "node:fs";
const file = new URL("../bun.lock", import.meta.url);
const pattern = /https:\/\/[a-z0-9-]+-npm\.pkg\.dev\/lovable-core-prod\/sandbox-npm-cache\//g;
const text = readFileSync(file, "utf8");
const count = (text.match(pattern) || []).length;
if (count === 0) {
  console.log("bun.lock: nada que corregir.");
} else {
  writeFileSync(file, text.replace(pattern, "https://registry.npmjs.org/"));
  console.log(`bun.lock: ${count} URL(s) corregidas al registro público de npm.`);
}
