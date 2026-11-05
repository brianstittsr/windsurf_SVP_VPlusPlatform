#!/usr/bin/env node
/**
 * SAM.gov opportunities search smoke test.
 * Reads SAM_API_KEY / SAM_GOV_API_KEY from .env.local, performs a real
 * search against the v2 API, and prints hit counts + a sample notice.
 *
 * Usage: node scripts/test-sam-search.mjs [keyword] [naics]
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const apiKey = process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY;
if (!apiKey) {
  console.error("No SAM_API_KEY or SAM_GOV_API_KEY found in env / .env.local");
  process.exit(1);
}

const keyword = process.argv[2] || "";
const naics = process.argv[3] || "";

const fmt = (d) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
const postedTo = new Date();
const postedFrom = new Date(postedTo.getTime() - 30 * 86400000);

const params = new URLSearchParams({
  api_key: apiKey,
  postedFrom: fmt(postedFrom),
  postedTo: fmt(postedTo),
  ptype: "p,o,k,r,s",
  limit: "10",
  offset: "0",
});
if (keyword) params.set("title", keyword);
if (naics) params.set("ncode", naics);

const url = `https://api.sam.gov/opportunities/v2/search?${params}`;
console.log(`Querying SAM.gov (posted ${fmt(postedFrom)} – ${fmt(postedTo)})${keyword ? ` title="${keyword}"` : ""}${naics ? ` naics=${naics}` : ""}`);

const res = await fetch(url);
const body = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`HTTP ${res.status}:`, body?.error?.message || body?.message || JSON.stringify(body).slice(0, 400));
  process.exit(1);
}

const data = body.opportunitiesData || [];
console.log(`totalRecords: ${body.totalRecords ?? "?"}, returned: ${data.length}`);
for (const n of data.slice(0, 5)) {
  console.log(
    `- [${n.type}] ${(n.title || "").slice(0, 80)} | ${n.department || n.subTier || ""} | NAICS ${n.naicsCode || "-"} | set-aside ${n.typeOfSetAsideDescription || n.typeOfSetAside || "none"} | due ${n.responseDeadLine || "-"}`
  );
}
console.log("\nOK — SAM API key and search parameters are working.");
