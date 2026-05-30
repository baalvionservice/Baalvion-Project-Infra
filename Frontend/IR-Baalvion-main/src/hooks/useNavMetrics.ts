'use client';

import { useState, useEffect, useCallback } from 'react';
import { NavHistoryPoint, IrrMetrics, SpvPerformance, CapitalTimelinePoint, PerformanceDocument } from '@/types/performance';
import { performanceApi } from '@/lib/ir-engagement';

/**
 * Institutional Performance Hook — live, backed by ir-service /api/v1/performance/metrics.
 * Returns the full performance snapshot (NAV history, IRR metrics, SPV performance, capital
 * timeline, factsheet documents). No static fallback.
 */
export function useNavMetrics() {
  const [navHistory, setNavHistory] = useState<NavHistoryPoint[]>([]);
  const [metrics, setMetrics] = useState<IrrMetrics | null>(null);
  const [spvPerformance, setSpvPerformance] = useState<SpvPerformance[]>([]);
  const [capitalTimeline, setCapitalTimeline] = useState<CapitalTimelinePoint[]>([]);
  const [documents, setDocuments] = useState<PerformanceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const d: any = await performanceApi.metrics();
      setNavHistory((d?.navHistory || []) as NavHistoryPoint[]);
      setMetrics((d?.metrics || null) as IrrMetrics | null);
      setSpvPerformance((d?.spvPerformance || []) as SpvPerformance[]);
      setCapitalTimeline((d?.capitalTimeline || []) as CapitalTimelinePoint[]);
      setDocuments((d?.documents || []) as PerformanceDocument[]);
    } catch {
      setNavHistory([]); setMetrics(null); setSpvPerformance([]); setCapitalTimeline([]); setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    navHistory,
    metrics,
    spvPerformance,
    capitalTimeline,
    documents,
    isLoading,
    currentNav: navHistory[navHistory.length - 1]?.nav || 0,
    refresh: fetchMetrics,
  };
}
