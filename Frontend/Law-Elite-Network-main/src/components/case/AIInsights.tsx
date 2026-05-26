"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Lightbulb, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCaseInsights } from '@/services/ai/aiService';
import Link from 'next/link';
import Image from 'next/image';

interface AIInsightsProps {
  caseData: any;
}

/**
 * @fileOverview AIInsights
 * High-fidelity intelligence dashboard for legal briefs.
 * Features automated summaries, strategic suggestions, and counsel recommendations.
 */
export default function AIInsights({ caseData }: AIInsightsProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        const data = await getCaseInsights(caseData);
        setInsights(data);
      } catch (error) {
        console.error("Intelligence synchronization failure:", error);
      } finally {
        setLoading(false);
      }
    };

    if (caseData) {
      loadInsights();
    }
  }, [caseData]);

  if (loading) {
    return (
      <div className="py-12 glass-panel rounded-3xl border-white/5 flex flex-col items-center justify-center gap-4 text-center px-8">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Analyzing Matter Parameters</p>
          <p className="text-xs text-muted-foreground italic">Platform intelligence is synchronizing with the global network ledger...</p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Strategic Summary */}
      <Card className="glass-panel border-accent/20 bg-accent/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Strategic Matter Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-white leading-relaxed italic text-lg">
            "{insights.summary}"
          </p>
          
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-accent" /> Recommended Protocols
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {insights.suggestions.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all group">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground group-hover:text-white transition-colors">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Counselor Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline text-xl italic text-white flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent" /> Intelligence Match: Elite Counsel
          </h3>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Top Domain Matches</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {insights.recommendedLawyers.map((lawyer: any) => (
            <Link key={lawyer.id} href={`/lawyer/${lawyer.id}`}>
              <Card className="glass-panel border-white/5 executive-card group h-full hover:border-accent/30 transition-all overflow-hidden bg-white/[0.01]">
                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-accent/50 transition-all shadow-xl">
                    <Image 
                      src={lawyer.profileImage || `https://picsum.photos/seed/${lawyer.id}/200/200`} 
                      alt={lawyer.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-white group-hover:text-accent transition-colors">{lawyer.name}</h5>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">{lawyer.specialization[0]} Counsel</p>
                  </div>
                  <div className="pt-2 mt-auto w-full">
                    <div className="flex items-center justify-center gap-1 text-accent text-[10px] font-bold mb-3">
                      <ShieldCheck className="w-3 h-3" /> Verified Elite
                    </div>
                    <Button variant="ghost" className="w-full h-8 text-[9px] font-bold uppercase tracking-widest bg-white/5 hover:bg-accent hover:text-accent-foreground group-hover:shadow-lg transition-all rounded-lg">
                      Audit Dossier <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 opacity-40 py-4 border-t border-white/5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <p className="text-[8px] font-bold uppercase tracking-[0.3em]">AI Intelligence Protocol v4.2.0 • Secured</p>
      </div>
    </div>
  );
}
