'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, TrendingUp, ShieldCheck, Scale, HandCoins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAi, type AiStrategy } from '@/hooks/use-ai';
import { useToast } from '@/hooks/use-toast';

type AnalysisResult = AiStrategy['acquire'];

export default function AcquirePlanner() {
  const { strategy } = useAi();
  const [targetName, setTargetName] = useState('');
  const [valuation, setValuation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!targetName || !valuation) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a target company and its valuation.',
      });
      return;
    }
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      setResults(strategy.acquire);
      setLoading(false);
    }, 1500);
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle>Acquisition Planner</CardTitle>
        <CardDescription>Model the financial impact of acquiring another business.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Target Company</Label>
            <Input placeholder="e.g., 'PayNow SG'" value={targetName} onChange={(e) => setTargetName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Target Valuation ($)</Label>
            <Input type="number" placeholder="e.g., 20000000" value={valuation} onChange={(e) => setValuation(e.target.value)} />
          </div>
          <div className="space-y-2 flex items-end">
            <Button onClick={handleAnalyze} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'Run Acquisition Analysis'}
            </Button>
          </div>
        </div>

        {results && (
          <div className="animate-in fade-in-0 duration-1000">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>AI Analysis for Acquiring {targetName}</CardTitle>
                  <Badge>
                      <Zap className="h-4 w-4 mr-1 text-yellow-400"/>
                      {results.confidence}% Confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{results.summary}</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-card/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp/>Projected ROI</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{results.roi}</p></CardContent></Card>
                      <Card className="bg-card/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Scale/>Integration Cost</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${results.integrationCost}</p></CardContent></Card>
                      <Card className="bg-card/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><ShieldCheck/>Synergy Savings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${results.synergySavings}</p></CardContent></Card>
                      <Card className="bg-card/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><HandCoins/>Offer Range</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">${results.offerRange}</p></CardContent></Card>
                  </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
