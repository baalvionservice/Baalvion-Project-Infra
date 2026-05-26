"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Loader2, 
  Zap, 
  CheckCircle2,
  Info,
  Sparkles,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { analyzeCasePrediction } from '@/services/predictions/predictionService';
import { CasePrediction } from '@/types/prediction';

interface CasePredictionsProps {
  caseData: any;
}

/**
 * @fileOverview CasePredictions
 * High-fidelity intelligence module for evaluating matter risk and success probability.
 */
export default function CasePredictions({ caseData }: CasePredictionsProps) {
  const [prediction, setPrediction] = useState<CasePrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const res = await analyzeCasePrediction(caseData);
        setPrediction(res);
      } catch (err) {
        console.error("Strategic analysis sync failure:", err);
      } finally {
        setLoading(false);
      }
    };

    if (caseData) {
      fetchPrediction();
    }
  }, [caseData]);

  if (loading) {
    return (
      <div className="py-12 glass-panel rounded-3xl border-white/5 flex flex-col items-center justify-center gap-4 text-center px-8">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <Target className="w-4 h-4 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Synchronizing Outcome Ledger</p>
          <p className="text-xs text-muted-foreground italic">Platform intelligence is simulating strategic outcomes...</p>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Success Probability Card */}
        <Card className="glass-panel border-emerald-500/20 bg-emerald-500/5 overflow-hidden shadow-2xl relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Success Probability
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-5xl font-headline italic text-white leading-none">
                {prediction.successProbability}%
              </h2>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-bold uppercase tracking-[0.2em] py-1 px-3">
                Favorable Outcome
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress value={prediction.successProbability} className="h-2 bg-emerald-500/10" />
              <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest text-right">Confidence Level: High</p>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score Card */}
        <Card className={`glass-panel overflow-hidden shadow-2xl relative group ${
          prediction.riskScore > 60 ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'
        }`}>
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 blur-3xl group-hover:opacity-40 transition-opacity ${
            prediction.riskScore > 60 ? 'bg-red-500/10' : 'bg-blue-500/10'
          }`} />
          <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
            <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
              prediction.riskScore > 60 ? 'text-red-400' : 'text-blue-400'
            }`}>
              <AlertTriangle className="w-4 h-4" /> Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-5xl font-headline italic text-white leading-none">
                {prediction.riskScore}
              </h2>
              <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-[0.2em] py-1 px-3 ${
                prediction.riskScore > 60 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {prediction.riskScore > 60 ? 'CRITICAL RISK' : 'MANAGED RISK'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress 
                value={prediction.riskScore} 
                className={`h-2 ${prediction.riskScore > 60 ? 'bg-red-500/10' : 'bg-blue-500/10'}`} 
              />
              <p className={`text-[9px] font-bold uppercase tracking-widest text-right ${
                prediction.riskScore > 60 ? 'text-red-400/60' : 'text-blue-400/60'
              }`}>Network Risk Ledger</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Complexity Section */}
      <Card className="glass-panel border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="bg-white/5 border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Strategic Insights
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Complexity:</span>
            <Badge className={`uppercase text-[9px] font-bold px-3 py-1 ${
              prediction.complexity === 'high' ? 'bg-red-500/10 text-red-400' : 
              prediction.complexity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
              'bg-emerald-500/10 text-emerald-400'
            }`}>
              {prediction.complexity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" /> Intelligence Signals
              </h4>
              <div className="space-y-3">
                {prediction.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent/30 transition-all group">
                    <CheckCircle2 className="w-4 h-4 text-accent/50 group-hover:text-accent mt-0.5" />
                    <p className="text-xs text-muted-foreground group-hover:text-white transition-colors italic">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-accent">
                <Info className="w-5 h-5" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Protocol Disclaimer</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                These predictive insights are generated by the Law Elite Intelligence protocol based on current matter parameters and network historical data. This output is for strategic evaluation only and <span className="text-white font-bold">must not be considered legal advice</span> or a guarantee of outcome.
              </p>
              <div className="pt-4 border-t border-accent/10">
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-accent/40">AI Intelligence Protocol v4.2.0 • Secured</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
