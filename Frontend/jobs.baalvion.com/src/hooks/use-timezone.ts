"use client";

import { useState, useEffect, useCallback } from 'react';

export function useTimezone() {
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    // This effect runs only on the client side
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const toLocalTime = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    // Coerce strings/numbers (backend sends ISO strings) to a Date defensively.
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };
    try {
      return new Intl.DateTimeFormat('en-US', { ...defaultOptions, timeZone: timezone }).format(d);
    } catch (e) {
      // Fallback for invalid timezone or other errors
      return d.toLocaleDateString();
    }
  }, [timezone]);

  return { timezone, toLocalTime };
}
