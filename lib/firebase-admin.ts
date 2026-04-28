import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let adminDb: Firestore | null = null;

// Check for required environment variables
const hasServiceAccount = !!(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
);

if (hasServiceAccount) {
  try {
    // Initialize with service account credentials
    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      app = getApps()[0];
    }

    adminDb = getFirestore(app);
  } catch (error) {
    console.error("[Firebase Admin] Failed to initialize:", error);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Fallback to GOOGLE_APPLICATION_CREDENTIALS
  try {
    if (getApps().length === 0) {
      app = initializeApp();
    } else {
      app = getApps()[0];
    }
    adminDb = getFirestore(app);
  } catch (error) {
    console.error("[Firebase Admin] Failed to initialize with default credentials:", error);
  }
} else {
  console.warn("[Firebase Admin] Not initialized - missing service account credentials");
}

export { adminDb };
export default app;
