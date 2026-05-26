'use client';

import { useState, useEffect, useCallback } from 'react';
import { Investor, SPV } from '@/lib/capital-ops/types';
import { INITIAL_INVESTORS, INITIAL_SPVS } from '@/lib/capital-ops/data';
import { useToast } from '@/hooks/use-toast';

/**
 * Future-Ready Capital Transactions Hook
 * Manages commitments, calls, and wire statuses.
 */
export function useCapitalTransactions() {
  const [investors, setInvestors] = useState<Investor[]>(INITIAL_INVESTORS);
  const [spvs, setSpvs] = useState<SPV[]>(INITIAL_SPVS);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchState = useCallback(async () => {
    // In future: fetch from /api/v1/capital/state
    // For now, static data is handled by state
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const issueCapitalCall = async (percentage: number) => {
    setIsProcessing(true);
    // Simulation logic
    setInvestors(prev => prev.map(inv => ({
      ...inv,
      pendingCallAmount: (inv.commitmentAmount * percentage) / 100,
      wireStatus: 'Not Initiated'
    })));
    setIsProcessing(false);
    toast({ title: "Call Issued", description: `${percentage}% drawdown notice broadcasted.` });
  };

  const updateWireStatus = async (investorId: string, status: 'Initiated' | 'Confirmed') => {
    setInvestors(prev => prev.map(inv => 
      inv.id === investorId ? { ...inv, wireStatus: status } : inv
    ));
  };

  return {
    investors,
    spvs,
    isProcessing,
    issueCapitalCall,
    updateWireStatus,
    refresh: fetchState
  };
}
