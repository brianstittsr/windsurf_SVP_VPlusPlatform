/**
 * One-off script: grant admin role to superadmin emails.
 *
 * For each SUPER_ADMIN_EMAILS entry:
 *  1. Find (or create) the teamMembers doc by email and set role: "admin".
 *  2. If a Firebase Auth user exists for the email, link firebaseUid on the
 *     teamMember doc and upsert users/{uid} with role: "admin" so the
 *     Firestore rules' isAdmin() check (users/{uid}.role == 'admin') applies.
 *
 * Loads credentials from .env.local using the same env vars as lib/firebase-admin.ts.
 * Run: node scripts/set-superadmins.mjs
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SUPER_ADMIN_EMAILS = [
  "bstitt@strategicvalueplus.com",
  "mhundal@strategicvalueplus.com",
];

// Parse .env.local without printing values
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
const auth = getAuth();

const findTeamMemberByEmail = async (email) => {
  const target = email.toLowerCase().trim();
  const snap = await db.collection("teamMembers").get();
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const primary = (data.emailPrimary || "").toLowerCase().trim();
    const secondary = (data.emailSecondary || "").toLowerCase().trim();
    if (primary === target || secondary === target) {
      return { id: docSnap.id, ...data };
    }
  }
  return null;
};

for (const email of SUPER_ADMIN_EMAILS) {
  console.log(`\n=== ${email} ===`);

  let teamMember = await findTeamMemberByEmail(email);
  if (teamMember) {
    await db.collection("teamMembers").doc(teamMember.id).update({
      role: "admin",
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`teamMembers/${teamMember.id}: role set to "admin" (was "${teamMember.role}")`);
  } else {
    const ref = await db.collection("teamMembers").add({
      firstName: "",
      lastName: "Hundal",
      emailPrimary: email,
      expertise: "",
      role: "admin",
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    teamMember = { id: ref.id };
    console.log(`teamMembers/${ref.id}: created new doc with role "admin"`);
  }

  // Link auth user (if one exists) and grant rules-level admin via users/{uid}
  let uid = teamMember.firebaseUid || null;
  if (!uid) {
    try {
      const authUser = await auth.getUserByEmail(email);
      uid = authUser.uid;
      await db.collection("teamMembers").doc(teamMember.id).update({
        firebaseUid: uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Linked firebaseUid ${uid} on teamMembers/${teamMember.id}`);
    } catch (err) {
      if (err?.code === "auth/user-not-found") {
        console.log("No Firebase Auth account for this email yet");
      } else {
        throw err;
      }
    }
  }

  if (uid) {
    await db.collection("users").doc(uid).set(
      { role: "admin", email, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    console.log(`users/${uid}: upserted with role "admin" (drives isAdmin() in firestore.rules)`);
  } else {
    console.log("Skipped users doc — no auth UID known yet. Re-run after this user signs up/in.");
  }
}

console.log("\nDone.");
