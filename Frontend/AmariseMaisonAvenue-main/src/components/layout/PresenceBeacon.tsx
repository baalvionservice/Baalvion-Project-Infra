'use client';

import { useEffect } from 'react';
import { sendHeartbeat } from '@/lib/presence';

// How often an open storefront tab re-announces itself. Comfortably inside the backend's
// ~45s presence window so a single missed beat (jitter) doesn't drop the visitor.
const HEARTBEAT_INTERVAL_MS = 25_000;

// Operator kill-switch: set NEXT_PUBLIC_PRESENCE_DISABLED=true to stop all heartbeats.
const DISABLED = process.env.NEXT_PUBLIC_PRESENCE_DISABLED === 'true';

/**
 * Invisible presence beacon. Mounted once in the storefront layout so every customer-facing page
 * pings commerce-service while its tab is in the foreground. Pauses on a hidden tab (no point
 * counting a backgrounded tab as "live") and resumes on focus. Renders nothing.
 */
export function PresenceBeacon() {
  useEffect(() => {
    if (DISABLED) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const start = () => {
      if (timer) return;
      void sendHeartbeat(); // beat immediately so a freshly-focused tab counts at once
      timer = setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, []);

  return null;
}
