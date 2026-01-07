/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes the Firebase Admin SDK for server-side operations
 * that require elevated privileges, such as:
 * - Deleting user accounts
 * - Managing custom claims
 * - Accessing Firestore with admin privileges
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

function initializeFirebaseAdmin() {
  // Check if already initialized
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return;
  }

  // Get service account credentials from environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId) {
    console.warn("Firebase Admin: Missing FIREBASE_PROJECT_ID environment variable");
    return;
  }

  try {
    // If we have service account credentials, use them
    if (clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin initialized with service account credentials");
    } else {
      // Try to initialize with default credentials (works in Google Cloud environments)
      // or with GOOGLE_APPLICATION_CREDENTIALS environment variable
      adminApp = initializeApp({
        projectId,
      });
      console.log("Firebase Admin initialized with default credentials");
    }

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

// Initialize on module load
initializeFirebaseAdmin();

export { adminApp, adminAuth, adminDb };
