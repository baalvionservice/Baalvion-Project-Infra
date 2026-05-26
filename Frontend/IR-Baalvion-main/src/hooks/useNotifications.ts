'use client';

import { useState, useEffect, useCallback } from 'react';
import { INITIAL_ALERTS } from '@/lib/alerts-mock';
import { alertApi, InvestorAlert as ApiInvestorAlert } from '@/lib/api-client';
import { InvestorAlert } from '@/types/alerts';
import { authService } from '@/core/services/auth.service';

/**
 * Event & Alert Hub Hook
 * Fetches live alerts from ir-service via alertApi.
 * Falls back to the static INITIAL_ALERTS mock when the service is unreachable.
 * Prepared for WebSocket/Push API integration.
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

      if (res.data) {
        // Cast the API type to the local InvestorAlert shape (compatible)
        const liveAlerts = res.data as unknown as InvestorAlert[];
        // Filter by role on the client side as a safety net
        const filtered = liveAlerts.filter(
          (a) => !a.targetRoles || a.targetRoles.includes(role) || role === 'admin'
        );
        setAlerts(filtered);
        setUnreadCount(filtered.filter((a) => !a.read).length);
      } else {
        // Fallback to static mock when service returns no data
        const { role } = await authService.getCurrentUser();
        const filtered = INITIAL_ALERTS.filter(
          (a) => a.targetRoles.includes(role) || role === 'admin'
        );
        setAlerts(filtered);
        setUnreadCount(filtered.filter((a) => !a.read).length);
      }
    } catch {
      // Service unreachable — fall back to static mock data
      try {
        const { role } = await authService.getCurrentUser();
        const filtered = INITIAL_ALERTS.filter(
          (a) => a.targetRoles.includes(role) || role === 'admin'
        );
        setAlerts(filtered);
        setUnreadCount(filtered.filter((a) => !a.read).length);
      } catch {
        setAlerts([]);
        setUnreadCount(0);
      }
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
