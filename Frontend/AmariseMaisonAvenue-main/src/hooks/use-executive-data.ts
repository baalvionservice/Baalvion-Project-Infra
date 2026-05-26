'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { ExecutiveRiskEngine, RiskScorecard } from '@/lib/executive/risk-engine';
import { CountryCode } from '@/lib/types';

/**
 * useExecutiveData: The High-Level Aggregation Hook.
 * Synthesizes data from all Maison tactical nodes for leadership oversight.
 */
export function useExecutiveData() {
  const { 
    scopedTransactions, 
    scopedErrors, 
    scopedAlerts, 
    scopedFraudLogs, 
    scopedProducts,
    scopedInquiries,
    countryConfigs,
    systemHealth,
    adminJurisdiction
  } = useAppStore();

  const riskScorecard = useMemo(() => 
    ExecutiveRiskEngine.calculatePlatformRisk(
      scopedTransactions, 
      scopedErrors, 
      scopedFraudLogs, 
      scopedAlerts
    ),
  [scopedTransactions, scopedErrors, scopedFraudLogs, scopedAlerts]);

  const summary = useMemo(() => {
    const settled = scopedTransactions.filter(t => t.status === 'Settled' || t.status === 'Closed');
    const totalRevenue = settled.reduce((acc, t) => acc + t.amount, 0);
    
    // Calculate performance per country
    const countryMetrics = countryConfigs.map(c => {
      const countryTrans = settled.filter(t => t.country === c.code);
      return {
        code: c.code,
        name: c.name,
        revenue: countryTrans.reduce((acc, t) => acc + t.amount, 0),
        orders: countryTrans.length,
        health: 90 + Math.random() * 10 // Mock regional health
      };
    });

    return {
      totalRevenue,
      totalOrders: settled.length,
      activeAlerts: scopedAlerts.filter(a => a.status === 'active').length,
      unresolvedErrors: scopedErrors.filter(e => !e.resolved).length,
      conversionRate: (settled.length / (scopedInquiries.length || 1) * 100).toFixed(1),
      avgOrderValue: totalRevenue / (settled.length || 1),
      countryMetrics,
      systemHealth: systemHealth.overall
    };
  }, [scopedTransactions, scopedAlerts, scopedErrors, scopedInquiries, countryConfigs, systemHealth]);

  return {
    summary,
    risk: riskScorecard,
    jurisdiction: adminJurisdiction,
    isGlobal: adminJurisdiction === 'global'
  };
}
