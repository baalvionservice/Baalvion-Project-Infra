"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  FileText,
  Zap
} from 'lucide-react';
import { getDocumentInsights } from '@/services/ai/aiService';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentAIInsightsProps {
  document: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * @fileOverview DocumentAIInsights
 * High-fidelity intelligence modal for legal record auditing.
 */
export default function DocumentAIInsights({ document, isOpen, onClose }: DocumentAIInsightsProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && document.id) {
      const load = async () => {
        setLoading(true);
        try {
          const data = await getDocumentInsights(document.id);
          setInsights(data);
        } catch (error) {
          console.error("Document intelligence retrieval failed", error);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [isOpen, document.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/10 text-white max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="font-headline text-2xl italic text-white flex items-center gap-2">
                Document Intelligence Audit
              </DialogTitle>
              <DialogDescription className="text-accent/60 font-bold uppercase tracking-widest text-[9px] mt-1 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> {document.fileName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-8">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Syncing Analysis Ledger...</p>
              </div>
            ) : !insights ? (
              <div className="py-20 text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-muted-foreground/20 mx-auto" />
                <p className="text-sm italic text-muted-foreground">Intelligence analysis not yet available for this record.</p>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
                {/* Executive Summary */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Strategic Summary
                  </h4>
                  <div className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02]">
                    <p className="text-white italic leading-relaxed text-lg">
                      "{insights.summary}"
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Key Obligations */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Intelligence Ledger
                    </h4>
                    <div className="space-y-3">
                      {insights.keyPoints.map((p: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all group">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/50 group-hover:text-emerald-400 mt-0.5" />
                          <p className="text-xs text-muted-foreground group-hover:text-white transition-colors">{p}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Risk Vectors */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Risk Perimeter
                    </h4>
                    <div className="space-y-3">
                      {insights.risks.map((r: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all group">
                          <Zap className="w-3.5 h-3.5 text-red-400/50 group-hover:text-red-400 mt-0.5" />
                          <p className="text-xs text-muted-foreground group-hover:text-white transition-colors">{r}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between opacity-40">
          <p className="text-[8px] font-bold uppercase tracking-[0.3em]">AI Audit Protocol v4.2.0 • Secured</p>
          <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-emerald-400">
            <ShieldCheck className="w-2.5 h-2.5" /> E2E Verified
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
