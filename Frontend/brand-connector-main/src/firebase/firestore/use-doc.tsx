
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, DocumentReference, FirestoreError } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(path: string | null) {
  const db = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemo(() => {
    if (!path || !db) return null;
    return doc(db, path);
  }, [db, path]);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData(snapshot.exists() ? (snapshot.data() as T) : null);
        setLoading(false);
      },
      async (serverError: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emitPermissionError(permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [docRef]);

  return { data, loading, error };
}
