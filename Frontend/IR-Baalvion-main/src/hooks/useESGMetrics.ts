'use client';

import { useState, useEffect, useCallback } from 'react';
import { MOCK_INTELLIGENCE_DATA } from '@/lib/intelligence-data';
import { EsgMetric } from '@/types/intelligence';

/**
 * Sustainability Intelligence Hook
 * Prepared for 3rd party ESG audit API integration.
 */
export function useESGMetrics() {
  const [metrics, setMetrics] = useState<EsgMetric[]>([]);
  const [globalScore, setGlobalScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchESG = useCallback(async () => {
    setIsLoading(true);
    // In future: fetch('/api/v1/compliance/esg')
    setMetrics(MOCK_INTELLIGENCE_DATA.esgMetrics);
    setGlobalScore(MOCK_INTELLIGENCE_DATA.globalEsgScore);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchESG();
  }, [fetchESG]);

  return {
    metrics,
    globalScore,
    isLoading,
    refresh: fetchESG
  };
}
