import "server-only";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// You should set these environment variables in your .env.local file
// For the private key, you might need to replace actual newlines or handle the string format depending on how you set it in your environment (e.g. Vercel vs local .env)
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app;

if (!getApps().length) {
  // If we have the credentials, use them (Production/Local with Env)
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Fallback: This might work in Google Cloud environments (like Cloud Run/Functions) where credentials are auto-detected
    // or if the user hasn't set up env vars yet, this prevents a crash but operations will fail.
    console.warn("Firebase Admin: Missing Service Account credentials.");
    app = initializeApp();
  }
} else {
  app = getApp();
}

export const adminDb = getFirestore(app);
