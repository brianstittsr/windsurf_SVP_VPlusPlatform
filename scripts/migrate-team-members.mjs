/**
 * One-off migration: backfill orphaned affiliate docs written to the
 * snake_case "team_members" collection into the canonical "teamMembers"
 * collection the app actually reads.
 *
 * For each team_members doc:
 *  1. If a teamMembers doc with the same emailPrimary (or firebaseUid) exists,
 *     merge missing fields into it and delete the orphan.
 *  2. Otherwise, recreate the doc in teamMembers (new ID) and delete the orphan.
 *
 * Loads credentials from .env.local (same vars as lib/firebase-admin.ts).
 * Run:    node scripts/migrate-team-members.mjs
 * Dry run: node scripts/migrate-team-members.mjs --dry-run
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const envPath = resolve(ROOT, ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = value;
}

const pick = (...names) => names.map((n) => process.env[n]).find(Boolean);
const projectId = pick("FIREBASE_PROJECT_ID", "FIREBASE_ADMIN_PROJECT_ID");
const clientEmail = pick("FIREBASE_CLIENT_EMAIL", "FIREBASE_ADMIN_CLIENT_EMAIL");
const privateKey = pick("FIREBASE_PRIVATE_KEY", "FIREBASE_ADMIN_PRIVATE_KEY")?.replace(/\\n/g, "\n");

if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp();
  } else {
    console.error("Missing Firebase Admin credentials in .env.local");
    process.exit(1);
  }
}

const db = getFirestore();

const findExisting = async ({ email, firebaseUid }) => {
  const snap = await db.collection("teamMembers").get();
  for (const d of snap.docs) {
    const data = d.data();
    if (firebaseUid && data.firebaseUid === firebaseUid) return d;
    if (email && (data.emailPrimary || "").toLowerCase().trim() === email) return d;
  }
  return null;
};

const snap = await db.collection("team_members").get();
console.log(`Found ${snap.size} doc(s) in team_members${DRY_RUN ? " (dry run)" : ""}`);

let merged = 0;
let moved = 0;
let skipped = 0;

for (const docSnap of snap.docs) {
  const data = docSnap.data();
  const email = (data.emailPrimary || data.email || "").toLowerCase().trim();
  const existing = await findExisting({ email, firebaseUid: data.firebaseUid });

  if (existing) {
    // Merge only fields missing on the canonical doc
    const existingData = existing.data();
    const missing = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null && v !== "" && existingData[k] === undefined) {
        missing[k] = v;
      }
    }
    if (!DRY_RUN) {
      if (Object.keys(missing).length) {
        await existing.ref.update({ ...missing, updatedAt: FieldValue.serverTimestamp() });
      }
      await docSnap.ref.delete();
    }
    console.log(
      `${docSnap.id} (${email || "no email"}): merged ${Object.keys(missing).length} missing field(s) into teamMembers/${existing.id}, deleted orphan`
    );
    merged++;
    continue;
  }

  if (!email && !data.firebaseUid) {
    console.log(`${docSnap.id}: no email or firebaseUid — skipping (review manually)`);
    skipped++;
    continue;
  }

  if (!DRY_RUN) {
    await db.collection("teamMembers").add({
      ...data,
      emailPrimary: data.emailPrimary || data.email || null,
      migratedFrom: "team_members",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await docSnap.ref.delete();
  }
  console.log(`${docSnap.id} (${email || data.firebaseUid}): moved to teamMembers`);
  moved++;
}

console.log(`\nDone${DRY_RUN ? " (dry run — nothing written)" : ""}: ${moved} moved, ${merged} merged, ${skipped} skipped`);
