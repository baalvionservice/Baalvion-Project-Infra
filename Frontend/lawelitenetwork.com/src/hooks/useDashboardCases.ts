
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCasesByClient } from '@/services/cases/caseService';

/**
 * @fileOverview useDashboardCases Hook
 * Orchestrates dynamic fetching and computation of case statistics.
 */
export function useDashboardCases(userId: string | undefined) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCasesByClient(userId);
      setCases(data || []);
    } catch (err: any) {
      console.error('Dashboard cases sync error:', err);
      setError(err.message || 'Failed to sync intelligence ledger.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const stats = {
    totalCases: cases.length,
    activeCases: cases.filter(c => c.status === 'active').length,
    draftCases: cases.filter(c => c.status === 'draft' || c.status === 'pending').length,
    closedCases: cases.filter(c => c.status === 'closed').length,
  };

  return {
    cases,
    loading,
    error,
    refresh: fetchCases,
    ...stats
  };
}
