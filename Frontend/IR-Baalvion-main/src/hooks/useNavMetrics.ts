'use client';

import { useState, useEffect, useCallback } from 'react';
import { NAV_HISTORY, PERFORMANCE_METRICS } from '@/lib/performance/data';
import { NavHistoryPoint, IrrMetrics } from '@/types/performance';

/**
 * Institutional Performance Hook
 * Prepared for real-time valuation assumptions API.
 */
export function useNavMetrics() {
  const [navHistory, setNavHistory] = useState<NavHistoryPoint[]>([]);
  const [metrics, setMetrics] = useState<IrrMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    // In future: await fetch('/api/v1/performance/metrics')
    setNavHistory(NAV_HISTORY);
    setMetrics(PERFORMANCE_METRICS);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    navHistory,
    metrics,
    isLoading,
    currentNav: navHistory[navHistory.length - 1]?.nav || 0,
    refresh: fetchMetrics
  };
}
