
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(results);
        setLoading(false);
      },
      async (serverError: FirestoreError) => {
        // We don't have the path from the query object directly in a clean way
        // but we can infer it or just report the failure.
        const permissionError = new FirestorePermissionError({
          path: 'collection_query',
          operation: 'list',
        });
        errorEmitter.emitPermissionError(permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [query]);

  return { data, loading, error };
}
