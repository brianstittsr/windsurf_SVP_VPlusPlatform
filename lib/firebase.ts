import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we have valid config
const hasValidConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Initialize Firebase app
let app: FirebaseApp | null = null;
if (hasValidConfig) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

// Firebase services - only initialize if app exists
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

// Analytics (only in browser)
export const initAnalytics = async () => {
  const isBrowser = typeof window !== "undefined";
  if (isBrowser && app && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
