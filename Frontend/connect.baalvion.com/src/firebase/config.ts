'use client';

/**
 * Vestigial Firebase config shape.
 *
 * brand-connector no longer talks to Firebase — `firebase/*` imports are redirected to the
 * REST-backed shim under `src/lib/fb-compat/*`, whose `initializeApp()` ignores these values.
 * The object is kept only so the legacy `initializeFirebase()` call site stays unchanged.
 * No real credentials are required, so there is intentionally no env guard here.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};
