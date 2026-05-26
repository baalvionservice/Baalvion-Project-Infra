'use client';
import React, { createContext, useContext } from 'react';

// Firebase removed — all data comes from law-service REST API.
// These stubs keep imports working without the Firebase SDK.

const FirebaseContext = createContext<null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode; [key: string]: unknown }) {
  return <FirebaseContext.Provider value={null}>{children}</FirebaseContext.Provider>;
}

export function useFirebase() { return null; }
export function useFirebaseApp() { return null; }
export function useAuth() { return null; }
export function useFirestore() { return null; }
export function useStorage() { return null; }
