"use client";

import { initializeApp, getApps, FirebaseApp } from "@/lib/fb-compat/app";
import { getAuth, Auth } from "@/lib/fb-compat/auth";
import { getFirestore, Firestore } from "@/lib/fb-compat/firestore";
import { getStorage, FirebaseStorage } from "@/lib/fb-compat/storage";
import { getMessaging, Messaging, isSupported } from "@/lib/fb-compat/messaging";
import { firebaseConfig } from "./config";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let messaging: Messaging | undefined;

export function initializeFirebase() {
  if (typeof window !== "undefined") {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Messaging initialization is async-checked
    isSupported().then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    });
  }
  return { app, auth, db, storage, messaging };
}

export {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from "./provider";
export { FirebaseClientProvider } from "./client-provider";
export { useUser } from "./auth/use-user";
export { useDoc } from "./firestore/use-doc";
export { useCollection } from "./firestore/use-collection";
export { useStorage } from "./provider";
