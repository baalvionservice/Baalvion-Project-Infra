'use client';

import React, { ReactNode, useMemo, useState, useEffect } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  // Initialize Firebase once on the client
  const firebase = useMemo(() => {
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return null;
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always wrap in FirebaseProvider so that children (Client Components)
  // don't throw "must be used within a FirebaseProvider" during SSR.
  return (
    <FirebaseProvider 
      app={firebase?.app} 
      auth={firebase?.auth} 
      firestore={firebase?.db} 
      storage={firebase?.storage}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
