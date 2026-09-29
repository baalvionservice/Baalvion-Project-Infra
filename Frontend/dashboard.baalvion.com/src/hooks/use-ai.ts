"use client";
// AI view (revenue predictions, growth opportunities, risk alerts + strategic scenarios) from the
// live dashboardApi.ai() reference endpoint.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface RevenuePrediction { businessId: string; currentMrr: number; forecasts: { threeMonth: number; sixMonth: number; twelveMonth: number }; confidence: number }
export interface GrowthOpportunity { id: string; title: string; description: string; estimatedImpact: string; confidence: number }
export interface RiskAlert { id: string; business: string; description: string; level: string }
export interface AiPredictions { confidenceScore: number; revenuePredictions: RevenuePrediction[]; growthOpportunities: GrowthOpportunity[]; riskAlerts: RiskAlert[] }
export interface AiStrategy {
  expand: { cost: string; timeToRevenue: string; riskLevel: string; confidence: number; requirements: string[]; competitors: string[]; summary: string };
  acquire: { roi: string; integrationCost: string; synergySavings: string; offerRange: string; confidence: number; summary: string };
  merge: { combinedRevenue: string; costSavings: string; redundantHeadcount: number; newEntityValue: string; confidence: number; summary: string };
  windDown: { outstandingLiabilities: string; employeeSeverance: string; assetLiquidationValue: string; netPosition: string; confidence: number; summary: string };
}

const EMPTY_PRED: AiPredictions = { confidenceScore: 0, revenuePredictions: [], growthOpportunities: [], riskAlerts: [] };
const EMPTY_STRAT: AiStrategy = {
  expand: { cost: "", timeToRevenue: "", riskLevel: "", confidence: 0, requirements: [], competitors: [], summary: "" },
  acquire: { roi: "", integrationCost: "", synergySavings: "", offerRange: "", confidence: 0, summary: "" },
  merge: { combinedRevenue: "", costSavings: "", redundantHeadcount: 0, newEntityValue: "", confidence: 0, summary: "" },
  windDown: { outstandingLiabilities: "", employeeSeverance: "", assetLiquidationValue: "", netPosition: "", confidence: 0, summary: "" },
};

export function useAi() {
  const [predictions, setPredictions] = useState<AiPredictions>(EMPTY_PRED);
  const [strategy, setStrategy] = useState<AiStrategy>(EMPTY_STRAT);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.ai();
        const obj = ((d as { data?: unknown })?.data ?? d) as { predictions?: AiPredictions; strategy?: AiStrategy };
        if (cancelled) return;
        setPredictions({ ...EMPTY_PRED, ...(obj?.predictions ?? {}) });
        setStrategy({ ...EMPTY_STRAT, ...(obj?.strategy ?? {}) });
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return { predictions, strategy };
}
