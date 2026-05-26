'use client';
// Firebase removed — all data now comes from law-service REST API.
// These stubs keep imports working across the codebase without Firebase SDK.

export function initializeFirebase() {
  return { app: null, auth: null, firestore: null, storage: null };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth as useFirebaseAuth, useFirestore, useStorage } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
