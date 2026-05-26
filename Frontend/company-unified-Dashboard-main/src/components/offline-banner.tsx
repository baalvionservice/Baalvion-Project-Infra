'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnline(null);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setLastOnline(new Date());
    };

    if (typeof window !== 'undefined') {
        if (!window.navigator.onLine) {
            handleOffline();
        }
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-center gap-4 bg-yellow-100 p-2 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Showing cached data from {lastOnline ? formatDistanceToNow(lastOnline, { addSuffix: true }) : 'a while ago'}.</span>
    </div>
  );
}
