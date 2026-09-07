'use client';

import { useState, useEffect, useCallback } from 'react';
import { Investor, SPV } from '@/lib/capital-ops/types';
import { useToast } from '@/hooks/use-toast';

/**
 * Capital transactions, read from the ir-service ledgers.
 *
 * This hook previously seeded itself from hardcoded investors and mutated them in React state:
 * `issueCapitalCall` set a pending amount and announced a "drawdown notice broadcasted" that was
 * never sent, and `updateWireStatus` marked money received in the browser. Both now go through
 * the real capital API, and a receipt cannot be recorded here at all — see below.
 *
 * `spvs` returns empty: there is no SPV or allocation domain behind it. An empty list is the
 * honest answer; inventing one is how the previous version got its numbers.
 */
export function useCapitalTransactions() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [spvs] = useState<SPV[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/capital/register', { cache: 'no-store' });
      if (!res.ok) {
        // No figures rather than stale or invented ones.
        setInvestors([]);
        setLoadError(res.status === 403 || res.status === 401
          ? 'Capital data is restricted to the IR and finance team.'
          : 'Capital data is unavailable.');
        return;
      }
      const json = await res.json();
      setLoadError(null);
      setInvestors((json.data ?? []).map((r: {
        id: string; investorName: string; commitmentAmount: number; calledToDate: number;
        remainingCommitment: number; outstanding: number; paidToDate: number;
      }) => ({
        id: r.id,
        name: r.investorName,
        commitmentAmount: r.commitmentAmount,
        calledToDate: r.calledToDate,
        remainingCommitment: r.remainingCommitment,
        // What is called but not yet received — derived, not a local flag.
        pendingCallAmount: r.outstanding,
        wireStatus: r.outstanding <= 0 && r.calledToDate > 0 ? 'Confirmed' : r.outstanding > 0 ? 'Initiated' : 'Not Initiated',
      })));
    } catch {
      setInvestors([]);
      setLoadError('Capital data is unavailable.');
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  const issueCapitalCall = async (percentage: number) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/capital/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callPct: percentage }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success) {
        toast({ title: 'Capital call issued', description: `${json.data?.reference} — notices are now visible to investors.` });
        await fetchState();
      } else {
        toast({ variant: 'destructive', title: 'Call not issued', description: json?.error?.message || 'The capital service rejected the request.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Call not issued', description: 'Could not reach the capital service.' });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Deliberately not implemented here. Recording a receipt requires a bank settlement reference,
   * which ir-service demands and this screen has no field for. Marking a wire confirmed without
   * one is exactly what the old version did, and it put money on the ledger that never arrived.
   */
  const updateWireStatus = async () => {
    toast({
      variant: 'destructive',
      title: 'Record the receipt in Capital Operations',
      description: 'A wire is confirmed against its bank settlement reference, not from this screen.',
    });
  };

  return { investors, spvs, isProcessing, loadError, issueCapitalCall, updateWireStatus, refresh: fetchState };
}
