'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Sparkles, Loader2, Zap, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIInsight as AIInsightType } from '@/types/ai';
import { AIInsightModal } from './AIInsightModal';

interface AIInsightProps {
  entityType: string;
  slug: string;
}

/**
 * AI Research Assistant Component.
 * Fetches and displays synthesized intelligence from the platform's AI kernel.
 */
export const AIInsight = ({ entityType, slug }: AIInsightProps) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/ai-insights?entityType=${entityType}&slug=${slug}`);
        if (!res.ok) throw new Error('API Handshake Failure');
        const data: AIInsightType = await res.json();
        setInsights(data.insights);
      } catch (err) {
        console.error('AI Kernel Fetch Error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (entityType && slug) {
      fetchInsights();
    }
  }, [entityType, slug]);

  return (
    <>
      <Card className="glass-card border-primary/20 bg-primary/5 overflow-hidden animate-in fade-in duration-700">
        <CardHeader className="bg-primary/10 border-b border-primary/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
              AI Research Assistant
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <Text variant="caption" className="animate-pulse font-bold uppercase tracking-tighter text-muted-foreground">
                Generating AI insights...
              </Text>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 py-4 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <Text variant="caption" className="font-bold">Unable to load AI insights at this time.</Text>
            </div>
          ) : (
            <div className="space-y-4">
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed italic">
                "{insights}"
              </Text>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase rounded-lg shadow-lg shadow-primary/20"
                  onClick={() => setIsModalOpen(true)}
                >
                  <FileText className="h-3 w-3 mr-1.5" /> Generate Detailed Report
                </Button>
                
                {/* Future: Connect to AI research API */}
                {/* Example: /api/ai-insights?entity=slug */}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AIInsightModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        entityType={entityType}
        slug={slug}
      />
    </>
  );
};
