'use client';

import { useEffect } from 'react';
import { connectWs, disconnectWs } from '@/lib/websocket/wsClient';
import { useRealtimeStore } from '@/lib/store/realtimeStore';

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    connectWs();
    return () => disconnectWs();
  }, []);

  return <>{children}</>;
}

// Convenience hook — components use this to read live data
export { useRealtimeStore };
