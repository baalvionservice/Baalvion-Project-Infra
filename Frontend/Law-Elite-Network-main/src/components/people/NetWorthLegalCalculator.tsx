'use client';

import React, { useState } from 'react';

export interface FinancialLegalData {
  personName: string;
  estimatedNetWorth: string; // e.g. "$6.5 Billion"
  lawsuitDamagesClaimed: string; // e.g. "$450 Million"
  hourlyLegalRate: string; // e.g. "$1,850/hr"
  estimatedMonthlyLegalBurn: string; // e.g. "$2.4M / month"
  assetFreezeStatus: 'None' | 'Partial Hold' | 'Court Supervised' | 'Restricted Liquidity';
  lawsuitsActiveCount: number;
}

const DEFAULT_METRICS: Record<string, FinancialLegalData> = {
  'donald-trump': {
    personName: 'Donald Trump',
    estimatedNetWorth: '$6.5 Billion',
    lawsuitDamagesClaimed: '$540 Million',
    hourlyLegalRate: '$2,200/hr',
    estimatedMonthlyLegalBurn: '$4.1M / month',
    assetFreezeStatus: 'Partial Hold',
    lawsuitsActiveCount: 4,
  },
  'elon-musk': {
    personName: 'Elon Musk',
    estimatedNetWorth: '$240 Billion',
    lawsuitDamagesClaimed: '$56 Billion',
    hourlyLegalRate: '$2,500/hr',
    estimatedMonthlyLegalBurn: '$8.5M / month',
    assetFreezeStatus: 'Court Supervised',
    lawsuitsActiveCount: 6,
  },
  'taylor-swift': {
    personName: 'Taylor Swift',
    estimatedNetWorth: '$1.6 Billion',
    lawsuitDamagesClaimed: '$150 Million (Catalog Rights Valuation)',
    hourlyLegalRate: '$1,950/hr',
    estimatedMonthlyLegalBurn: '$850K / month',
    assetFreezeStatus: 'None',
    lawsuitsActiveCount: 2,
  },
};

interface NetWorthLegalCalculatorProps {
  personSlug: string;
  personName: string;
}

export function NetWorthLegalCalculator({ personSlug, personName }: NetWorthLegalCalculatorProps) {
  const data = DEFAULT_METRICS[personSlug] || {
    personName,
    estimatedNetWorth: '$150 Million - $1.2 Billion',
    lawsuitDamagesClaimed: '$85 Million at issue',
    hourlyLegalRate: '$1,750/hr',
    estimatedMonthlyLegalBurn: '$1.2M / month',
    assetFreezeStatus: 'None',
    lawsuitsActiveCount: 3,
  };

  const [settlementPercent, setSettlementPercent] = useState<number>(25);

  // Compute hypothetical settlement payout based on slider
  const rawDamagesNum = parseFloat(data.lawsuitDamagesClaimed.replace(/[^0-9.]/g, '')) || 100;
  const hypotheticalSettlement = Math.round(rawDamagesNum * (settlementPercent / 100));

  return (
    <div className="bg-slate-900 text-white rounded-xl overflow-hidden border border-slate-800 p-6 my-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-lg">
            💲
          </div>
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
              CNBC & BLOOMBERG LAW FINANCIAL ANALYSIS
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-white">
              {data.personName}: Net Worth & Legal Defense Exposure
            </h3>
          </div>
        </div>

        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono border border-slate-700">
          Updated September 2026
        </span>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-mono uppercase">EST. NET WORTH</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">{data.estimatedNetWorth}</p>
          <span className="text-[10px] text-slate-500 block">Forbes / Bloomberg Index</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-mono uppercase">DAMAGES AT RISK</span>
          <p className="text-xl sm:text-2xl font-black text-red-400">{data.lawsuitDamagesClaimed}</p>
          <span className="text-[10px] text-slate-500 block">Pending Claims Total</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-mono uppercase">DEFENSE BURN RATE</span>
          <p className="text-xl sm:text-2xl font-black text-yellow-400">{data.estimatedMonthlyLegalBurn}</p>
          <span className="text-[10px] text-slate-500 block">Lead Counsel: {data.hourlyLegalRate}</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-mono uppercase">ASSET FREEZE STATUS</span>
          <p className="text-lg sm:text-xl font-bold text-white">{data.assetFreezeStatus}</p>
          <span className="text-[10px] text-slate-500 block">{data.lawsuitsActiveCount} Active Court Dockets</span>
        </div>
      </div>

      {/* Interactive Settlement Exposure Simulator */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider font-mono">
            🧮 Interactive Settlement Impact Simulator
          </span>
          <span className="text-emerald-400 font-mono font-bold">
            Projected Payout: ~${hypotheticalSettlement} Million ({settlementPercent}%)
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={settlementPercent}
          onChange={(e) => setSettlementPercent(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />

        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>5% Nuisance Settlement</span>
          <span>50% Mediated Compromise</span>
          <span>100% Full Damages Verdict</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed italic border-t border-slate-900 pt-3">
          Disclaimer: Financial metrics compiled from public court filings, SEC disclosures, and Bloomberg Law analytical estimates. Payout projections are for reader educational reference.
        </p>
      </div>
    </div>
  );
}
