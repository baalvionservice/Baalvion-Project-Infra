'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, FileText, Users, AlertTriangle, Building, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAi, type AiStrategy } from '@/hooks/use-ai';
import { useGlobalFinancials } from '@/hooks/use-global-financials';
import { useToast } from '@/hooks/use-toast';

const industries = ["Fintech", "E-commerce", "Media", "SaaS", "Logistics"];

type AnalysisResult = AiStrategy['expand'];

export default function ExpandPlanner() {
  const { strategy } = useAi();
  const { countries: countriesData } = useGlobalFinancials();
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!country || !industry) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a country and an industry to analyze.',
      });
      return;
    }
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      setResults(strategy.expand);
      setLoading(false);
    }, 1500);
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle>Market Expansion Planner</CardTitle>
        <CardDescription>Analyze the potential of entering a new international market.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Target Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
              <SelectContent>{countriesData.map(c => <SelectItem key={c.id} value={c.name}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue placeholder="Select an industry" /></SelectTrigger>
              <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex items-end">
            <Button onClick={handleAnalyze} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'Analyze Market'}
            </Button>
          </div>
        </div>

        {results && (
          <div className="animate-in fade-in-0 duration-1000">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>AI Analysis for {industry} in {country}</CardTitle>
                  <Badge>
                      <Zap className="h-4 w-4 mr-1 text-yellow-400"/>
                      {results.confidence}% Confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><DollarSign/>Key Financials</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><span className="font-semibold">Estimated Setup Cost:</span> ${results.cost}</p>
                      <p><span className="font-semibold">Time to First Revenue:</span> {results.timeToRevenue}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle/>Risk Assessment</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      <p><span className="font-semibold">Overall Risk Level:</span> <Badge variant="destructive" className="bg-orange-500">{results.riskLevel}</Badge></p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText />Regulatory Requirements</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {results.requirements.map((req, i) => <li key={i}>{req}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building />Local Competitors</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {results.competitors.map((comp, i) => <li key={i}>{comp}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
