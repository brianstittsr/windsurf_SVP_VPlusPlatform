import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const envPath = resolve(ROOT, ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = value;
}

const pick = (...names) => names.map((n) => process.env[n]).find(Boolean);
const projectId = pick("FIREBASE_PROJECT_ID", "FIREBASE_ADMIN_PROJECT_ID");
const clientEmail = pick("FIREBASE_CLIENT_EMAIL", "FIREBASE_ADMIN_CLIENT_EMAIL");
const privateKey = pick("FIREBASE_PRIVATE_KEY", "FIREBASE_ADMIN_PRIVATE_KEY")?.replace(/\\n/g, "\n");

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();
const cols = await db.listCollections();
for (const c of cols) {
  const s = await c.get();
  for (const d of s.docs) {
    const json = JSON.stringify(d.data()).toLowerCase();
    if (json.includes("keith") || json.includes("moore")) {
      const m = d.data();
      console.log(`HIT ${c.id}/${d.id} | ${m.firstName || ""} ${m.lastName || ""} ${m.name || ""} | keys: ${Object.keys(m).slice(0, 12).join(",")}`);
    }
  }
}
console.log("scan complete");
