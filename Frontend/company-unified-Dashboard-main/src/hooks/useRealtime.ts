'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  realtimeClient,
  type RealtimeEventMap,
  type RealtimeEventType,
} from '@/lib/realtime-client';
import { tokenStore } from '@/lib/api-client';

export interface UseRealtimeReturn {
  /** Whether the WebSocket is currently connected. */
  connected: boolean;
  /** The most recently received event (any type). */
  lastEvent: { type: RealtimeEventType; payload: unknown } | null;
  /** Subscribe to a specific event type. Returns an unsubscribe function. */
  subscribe: <T extends RealtimeEventType>(
    event: T,
    handler: (payload: RealtimeEventMap[T]) => void,
  ) => () => void;
  /** Unsubscribe a specific handler from an event. */
  unsubscribe: <T extends RealtimeEventType>(
    event: T,
    handler: (payload: RealtimeEventMap[T]) => void,
  ) => void;
}

export function useRealtime(): UseRealtimeReturn {
  const [connected, setConnected] = useState<boolean>(realtimeClient.connected);
  const [lastEvent, setLastEvent] = useState<{
    type: RealtimeEventType;
    payload: unknown;
  } | null>(null);

  // Track connection state
  useEffect(() => {
    const token = tokenStore.getAccess();
    if (token && !realtimeClient.connected) {
      realtimeClient.connect(token);
    }

    const onConnected = () => setConnected(true);
    const onDisconnected = () => setConnected(false);

    realtimeClient.on('connected', onConnected);
    realtimeClient.on('disconnected', onDisconnected);

    // Sync initial state
    setConnected(realtimeClient.connected);

    return () => {
      realtimeClient.off('connected', onConnected);
      realtimeClient.off('disconnected', onDisconnected);
    };
  }, []);

  // Proxy event type capture for lastEvent
  useEffect(() => {
    const eventTypes: RealtimeEventType[] = [
      'notification',
      'kpi_update',
      'alert',
      'presence',
    ];

    const handlers = eventTypes.map((type) => {
      const handler = (payload: unknown) => {
        setLastEvent({ type, payload });
      };
      realtimeClient.on(type as RealtimeEventType, handler as never);
      return { type, handler };
    });

    return () => {
      handlers.forEach(({ type, handler }) =>
        realtimeClient.off(type as RealtimeEventType, handler as never),
      );
    };
  }, []);

  const subscribe = useCallback(
    <T extends RealtimeEventType>(
      event: T,
      handler: (payload: RealtimeEventMap[T]) => void,
    ): (() => void) => {
      realtimeClient.on(event, handler);
      return () => realtimeClient.off(event, handler);
    },
    [],
  );

  const unsubscribe = useCallback(
    <T extends RealtimeEventType>(
      event: T,
      handler: (payload: RealtimeEventMap[T]) => void,
    ): void => {
      realtimeClient.off(event, handler);
    },
    [],
  );

  return { connected, lastEvent, subscribe, unsubscribe };
}
