'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  Download, 
  ShieldCheck, 
  Zap, 
  Save, 
  ArrowRight,
  Info
} from 'lucide-react';
import { AIInsight as AIInsightType } from '@/types/ai';
import { cn } from '@/lib/utils';

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  slug: string;
}

/**
 * AI Research Report Generator Modal.
 * High-fidelity interface for generating and viewing synthesized intelligence reports.
 */
export const AIInsightModal = ({ isOpen, onClose, entityType, slug }: AIInsightModalProps) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setError(false);
    try {
      // Simulate complex analysis latency
      const res = await fetch(`/api/ai-insights?entityType=${entityType}&slug=${slug}`);
      if (!res.ok) throw new Error('Handshake Failure');
      const data: AIInsightType = await res.json();
      
      // Artificial delay to simulate processing
      await new Promise(r => setTimeout(r, 1500));
      
      setReport(data.insights);
    } catch (err) {
      console.error('Report Generation Error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Trigger generation automatically when opened if no report exists
  useEffect(() => {
    if (isOpen && !report && !loading) {
      generateReport();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-white/10 p-0 overflow-hidden shadow-3xl">
        <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Analyst Kernel v1.0</Text>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase">Verified Node</span>
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" /> 
            AI Research Report: {slug.charAt(0).toUpperCase() + slug.slice(1)}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-base">
            Institutional-grade synthesis of market data and structural research for the {entityType} node.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar bg-background/50">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <Text variant="h4" className="font-bold">Generating Institutional Report...</Text>
                <Text variant="bodySmall" className="text-muted-foreground italic">
                  Traversing knowledge clusters and cross-referencing datasets.
                </Text>
              </div>
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4">
              <Info className="h-12 w-12 text-destructive mx-auto" />
              <Text variant="body" className="text-destructive font-bold">Unable to generate report at this time.</Text>
              <Button variant="outline" onClick={generateReport} className="border-destructive/20 text-destructive">
                Retry Handshake
              </Button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 italic text-lg leading-relaxed text-foreground/90">
                "{report}"
              </div>
              
              <div className="space-y-4">
                <Text variant="h4" className="font-bold border-b border-white/5 pb-2">Strategic Triage</Text>
                <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                  The Analyst Engine has identified significant decoupling between current market sentiment and historical fundamental benchmarks for this node. In Phase 2, this section will include:
                </Text>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Longitudinal Volatility Audit',
                    'Sentiment Drift Correlation',
                    'Institutional Liquidity Depth',
                    'Structural Risk Assessment'
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-xs font-bold uppercase tracking-tighter text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TODO: Connect to OpenAI / LLM API */}
              {/* TODO: Include advanced analytics, charts, tables */}
              {/* TODO: Cache reports for faster loading */}
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
          <Button variant="ghost" onClick={onClose} className="h-12 px-8 rounded-xl font-bold">Close Terminal</Button>
          <div className="flex-1" />
          <Button variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary gap-2" onClick={() => handleAction('Download')}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="h-12 px-10 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2" onClick={() => handleAction('Save')}>
            <Save className="h-4 w-4" /> Save to Index
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Mock helper for actions
const handleAction = (action: string) => {
  alert(`${action} functionality will be integrated in Phase 2.`);
};
