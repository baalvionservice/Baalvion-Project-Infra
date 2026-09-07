'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value (a search box) before it drives a request.
 *
 * Without this, server-side search fires one request per keystroke — and because responses
 * can arrive out of order, the list could settle on the results of an earlier, shorter query.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
