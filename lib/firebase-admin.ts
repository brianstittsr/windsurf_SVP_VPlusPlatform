import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App | undefined;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;
let adminStorage: Storage | null = null;

// Check for required environment variables (support both FIREBASE_* and FIREBASE_ADMIN_* prefixes)
const hasServiceAccount = !!(
  (process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID) &&
  (process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL) &&
  (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY)
);

if (hasServiceAccount) {
  try {
    // Initialize with service account credentials
    const serviceAccount = {
      projectId:
        process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail:
        process.env.FIREBASE_CLIENT_EMAIL ||
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (
        process.env.FIREBASE_PRIVATE_KEY ||
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
      )?.replace(/\\n/g, "\n"),
    };

    app =
      getApps().length === 0
        ? initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          })
        : getApps()[0];

    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
    adminStorage = getStorage(app);
  } catch (error) {
    console.error("[Firebase Admin] Failed to initialize:", error);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Fallback to GOOGLE_APPLICATION_CREDENTIALS
  try {
    app =
      getApps().length === 0
        ? initializeApp({
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          })
        : getApps()[0];
    adminDb = getFirestore(app);
    adminAuth = getAuth(app);
    adminStorage = getStorage(app);
  } catch (error) {
    console.error(
      "[Firebase Admin] Failed to initialize with default credentials:",
      error
    );
  }
} else {
  console.warn(
    "[Firebase Admin] Not initialized - missing service account credentials"
  );
}

export { adminDb, adminAuth, adminStorage };
export default app;
