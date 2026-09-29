
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, FirestoreError } from '@/lib/fb-compat/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Call sites pass an inline `query(collection(db,'x'), …)`, which is a NEW object every render.
  // Keying the effect on the object identity would re-subscribe every render → immediate fetch →
  // setState → re-render → infinite request storm (and rate-limit 429s). Depend on a stable
  // serialization of the query shape so we only re-subscribe when the query actually changes.
  const queryKey = query ? JSON.stringify(query) : null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return { data, loading, error };
}
