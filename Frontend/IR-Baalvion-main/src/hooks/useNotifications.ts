'use client';

import { useState, useEffect, useCallback } from 'react';
import { alertApi } from '@/lib/api-client';
import { InvestorAlert } from '@/types/alerts';
import { authService } from '@/core/services/auth.service';

/**
 * Event & Alert Hub Hook
 * Fetches live alerts from ir-service via alertApi. No static fallback — on error the feed is
 * empty rather than serving mock data. Prepared for WebSocket/Push API integration.
 */
export function useNotifications() {
  const [alerts, setAlerts] = useState<InvestorAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { role } = await authService.getCurrentUser();
      const res = await alertApi.list();
      const liveAlerts = (res.data || []) as unknown as InvestorAlert[];
      // Role-filter client-side as a safety net (the backend is single-tenant org-scoped).
      const filtered = liveAlerts.filter(
        (a) => !a.targetRoles || a.targetRoles.includes(role) || role === 'admin'
      );
      setAlerts(filtered);
      setUnreadCount(filtered.filter((a) => !a.read).length);
    } catch {
      // Service unreachable — show an empty feed, never mock content.
      setAlerts([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    window.addEventListener('auth-updated', fetchAlerts);
    return () => window.removeEventListener('auth-updated', fetchAlerts);
  }, [fetchAlerts]);

  const markAsRead = async (alertId: string) => {
    // Optimistic update
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // Persist to backend (best-effort, non-blocking)
    alertApi.markRead(alertId).catch(() => {});
  };

  return {
    alerts,
    unreadCount,
    isLoading,
    markAsRead,
    refresh: fetchAlerts,
  };
}
