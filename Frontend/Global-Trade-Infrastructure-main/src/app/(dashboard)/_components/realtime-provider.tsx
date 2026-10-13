'use client';

/**
 * Mounts the realtime WebSocket connection for the authenticated dashboard,
 * surfaces a connection indicator, and raises toasts on inbound notifications.
 */
import { useEffect, useState } from 'react';
import { realtime } from '@/lib/realtime';
import { getAccessToken } from '@/lib/api-client';
import { useRealtimeStatus, useRoom } from '@/hooks/use-realtime';
import { useToast } from '@/hooks/use-toast';
import { WifiOff, Loader2 } from 'lucide-react';

function readOrgCode(): string | null {
  try {
    const t = getAccessToken(); // in-memory access token (P0: never localStorage)
    return t ? (JSON.parse(atob(t.split('.')[1])).orgCode || null) : null;
  } catch { return null; }
}

export function RealtimeProvider() {
  const { toast } = useToast();
  const status = useRealtimeStatus();
  const [org, setOrg] = useState<string | null>(null);

  useEffect(() => { realtime.connect(); setOrg(readOrgCode()); }, []);

  // Toast on inbound org notifications (skip replayed history on reconnect).
  useRoom(org ? `org:${org}` : null, (evt) => {
    if (evt.event === 'notification' && !evt.replayed) {
      const d = evt.data || {};
      toast({ title: d.title || 'Notification', description: d.message });
    }
  });

  // Only speak up when live updates are not flowing, and only after a few seconds, so a normal
  // page load (which connects a moment after the page appears) never flashes a warning.
  const [notConnectedFor5s, setNotConnectedFor5s] = useState(false);
  useEffect(() => {
    if (status === 'open') { setNotConnectedFor5s(false); return undefined; }
    const t = setTimeout(() => setNotConnectedFor5s(true), 5000);
    return () => clearTimeout(t);
  }, [status]);

  if (status === 'open' || !notConnectedFor5s) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4">
      <p
        role="status"
        className="pointer-events-auto flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-md"
      >
        {status === 'connecting'
          ? <><Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Reconnecting for live updates…</>
          : <><WifiOff aria-hidden className="h-4 w-4" /> Live updates are paused. The page still works; refresh to see the latest.</>}
      </p>
    </div>
  );
}
