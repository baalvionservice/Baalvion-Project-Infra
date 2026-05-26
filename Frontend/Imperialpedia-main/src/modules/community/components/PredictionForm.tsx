'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Info,
  DollarSign,
  Zap,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PredictionFormProps {
  asset: string;
  question: string;
  onSuccess?: () => void;
}

/**
 * High-fidelity prediction submission form.
 * Features sentiment toggles, target price nodes, and instructional logic reasoning.
 */
export function PredictionForm({ asset, question, onSuccess }: PredictionFormProps) {
  const [sentiment, setSentiment] = useState<'Bull' | 'Bear' | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentiment || !targetPrice) return;

    setSubmitting(true);
    // Simulate data handshake
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setIsSuccess(true);
    
    toast({
      title: "Forecast Registered",
      description: `Your ${sentiment} case for ${asset} has been committed to the leaderboard.`,
    });

    if (onSuccess) setTimeout(onSuccess, 2000);
  };

  if (isSuccess) {
    return (
      <Card className="glass-card border-emerald-500/20 bg-emerald-500/5 p-10 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <Text variant="h3" className="text-2xl font-bold mb-2">Forecast Secured</Text>
        <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Your prediction has been cryptographically signed and added to the competitive matrix. Monitor the leaderboard for precision adjustments.
        </Text>
        <Button variant="outline" className="mt-8 rounded-xl border-emerald-500/20 text-emerald-500" onClick={() => setIsSuccess(false)}>
          Submit Another Node
        </Button>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-none shadow-2xl overflow-hidden group">
      <CardHeader className="bg-card/30 border-b border-white/5 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <Text variant="label" className="text-[10px] font-bold text-primary uppercase tracking-widest">Contest Participation</Text>
            <CardTitle className="text-xl font-bold">{asset} Forecast</CardTitle>
          </div>
        </div>
        <Text variant="bodySmall" className="text-foreground/90 font-medium italic border-l-2 border-primary/20 pl-4 py-1">
          "{question}"
        </Text>
      </CardHeader>

      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sentiment Selection */}
          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Market Sentiment</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSentiment('Bull')}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300",
                  sentiment === 'Bull' ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-900/20" : "bg-background/40 border-white/5 hover:border-emerald-500/30"
                )}
              >
                <TrendingUp className={cn("h-8 w-8 mb-2", sentiment === 'Bull' ? "text-emerald-500" : "text-muted-foreground")} />
                <span className={cn("font-bold text-xs uppercase tracking-widest", sentiment === 'Bull' ? "text-emerald-500" : "text-muted-foreground")}>Bullish</span>
              </button>
              <button
                type="button"
                onClick={() => setSentiment('Bear')}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300",
                  sentiment === 'Bear' ? "bg-destructive/10 border-destructive shadow-lg shadow-destructive/20" : "bg-background/40 border-white/5 hover:border-destructive/30"
                )}
              >
                <TrendingDown className={cn("h-8 w-8 mb-2", sentiment === 'Bear' ? "text-destructive" : "text-muted-foreground")} />
                <span className={cn("font-bold text-xs uppercase tracking-widest", sentiment === 'Bear' ? "text-destructive" : "text-muted-foreground")}>Bearish</span>
              </button>
            </div>
          </div>

          {/* Value Prediction */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Price Prediction ($)</Label>
            <div className="relative group">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="number" 
                placeholder="64250.00" 
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl text-lg font-bold font-mono"
                required
              />
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Instructional Reasoning (Optional)</Label>
            <Textarea 
              placeholder="Explain the macro or technical catalyst behind your forecast..." 
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              className="bg-background/50 border-white/5 min-h-[120px] resize-none leading-relaxed rounded-2xl italic"
            />
          </div>

          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Once submitted, your forecast is locked until the contest period terminates. Accuracy points are awarded based on proximity to the settlement price.
            </Text>
          </div>

          <Button 
            type="submit" 
            disabled={submitting || !sentiment || !targetPrice} 
            className="w-full h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all scale-[1.02] active:scale-100"
          >
            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            Register Forecast Node
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
