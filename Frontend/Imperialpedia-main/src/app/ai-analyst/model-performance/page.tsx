'use client';

import React, { useState } from 'react';
import { reportModelPerformance, ModelPerformanceOutput } from '@/ai/flows/model-performance-flow';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  Zap, 
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Search,
  Target,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AI Model Performance Tracking Dashboard.
 * Specialized interface for monitoring the integrity and accuracy of the AI Analyst suite.
 */
export default function ModelPerformancePage() {
  const [period, setPeriod] = useState<'Week' | 'Month'>('Week');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ModelPerformanceOutput | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const output = await reportModelPerformance({ period });
      setResult(output);
      toast({
        title: "Integrity Report Ready",
        description: `AI performance metrics for the last ${period.toLowerCase()} have been synchronized.`,
      });
    } catch (error) {
      console.error('AI Integrity failure', error);
      toast({
        variant: "destructive",
        title: "Audit Exception",
        description: "The AI engine failed to connect to the performance telemetry buffer.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20 pt-12">
      <Container>
        <header className="mb-12 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-6">
            <ShieldCheck className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Model Integrity Node v4.2</Text>
          </div>
          <Text variant="h1" className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Model Performance</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
            Monitor the accuracy and reliability of the Imperialpedia Analyst Engine. Track predictions, sentiment precision, and strategic directive outcomes.
          </Text>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="w-full sm:w-48">
              <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                <SelectTrigger className="h-14 bg-card/30 border-white/10 rounded-2xl">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Week">Weekly Audit</SelectItem>
                  <SelectItem value="Month">Monthly Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              size="lg" 
              onClick={handleGenerate} 
              disabled={loading}
              className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.05] active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <RefreshCw className="mr-2 h-5 w-5" />}
              {loading ? 'Decrypting Telemetry...' : 'Generate Integrity Report'}
            </Button>
          </div>
        </header>

        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 relative">
              <div className="absolute inset-0 rounded-[2.5rem] border-2 border-primary/20 animate-ping opacity-20" />
              <Activity className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <Text variant="h3" className="font-bold mb-2">Aggregating Model Vitals</Text>
            <Text variant="bodySmall" className="text-muted-foreground text-center max-w-sm">
              Analyzing historical predictions, classification accuracy, and recommendation outcomes across the cluster...
            </Text>
          </div>
        )}

        {result && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Aggregate Accuracy Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card border-none shadow-xl group hover:border-emerald-500/20 transition-all">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prediction Accuracy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{result.accuracy_metrics.prediction_accuracy}</div>
                  <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Stable vs Baseline
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sentiment Precision</CardTitle>
                  <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{result.accuracy_metrics.sentiment_accuracy}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">Classification Depth</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-xl group hover:border-amber-500/20 transition-all">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Error Rate</CardTitle>
                  <Zap className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{result.accuracy_metrics.error_rate}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">Exceptional Throttling</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-xl bg-primary/5">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-primary">Audit Confidence</CardTitle>
                  <Target className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{result.confidence_score}%</div>
                  <Progress value={result.confidence_score} className="h-1.5 mt-3 bg-primary/10" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Predictions & Recommendations */}
              <div className="lg:col-span-8 space-y-8">
                {/* Overview Card */}
                <Card className="glass-card border-none shadow-2xl overflow-hidden bg-primary/5">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <div className="p-4 rounded-3xl bg-primary/10 text-primary shrink-0">
                        <Info className="h-8 w-8" />
                      </div>
                      <div>
                        <Text variant="h3" className="mb-2 font-bold">Executive Audit Summary</Text>
                        <Text variant="body" className="text-muted-foreground leading-relaxed italic">
                          "{result.overview}"
                        </Text>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Predictions Performance Table */}
                <Card className="glass-card border-none shadow-2xl overflow-hidden">
                  <CardHeader className="bg-card/30 border-b border-white/5 p-6">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" /> Forecast Integrity Matrix
                    </CardTitle>
                    <CardDescription>Recent AI predictions cross-referenced with empirical market outcomes.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 border-b border-white/5">
                          <TableHead className="pl-8 font-bold uppercase text-[10px] tracking-widest py-4">Asset Node</TableHead>
                          <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">AI Forecast</TableHead>
                          <TableHead className="text-center font-bold uppercase text-[10px] tracking-widest">Market Actual</TableHead>
                          <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.recent_predictions_performance.map((row, idx) => (
                          <TableRow key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="pl-8 py-5">
                              <Text variant="bodySmall" weight="bold" className="text-foreground">{row.asset}</Text>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">{row.predicted}</TableCell>
                            <TableCell className="text-center font-mono text-sm font-bold text-primary">{row.actual}</TableCell>
                            <TableCell className="text-right pr-8">
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold uppercase">Accurate</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Recommendations Audit */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Target className="h-5 w-5 text-secondary" />
                    <Text variant="h4" className="font-bold">Strategic Recommendation Audit</Text>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.recommendations_accuracy.map((rec, i) => (
                      <Card key={i} className="glass-card border-white/5 bg-background/40 hover:border-secondary/30 transition-colors">
                        <CardContent className="p-5 space-y-3">
                          <Text variant="bodySmall" weight="bold" className="leading-relaxed">"{rec.recommendation}"</Text>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <Text variant="label" className="text-[9px] opacity-50">Market Outcome</Text>
                            <Badge className={cn(
                              "text-[9px] font-bold uppercase px-2 py-0.5",
                              rec.outcome === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' : 
                              rec.outcome === 'Negative' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                            )}>
                              {rec.outcome}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Trend Detection & Alerts */}
              <div className="lg:col-span-4 space-y-8">
                {/* Trend Detection Stats */}
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Trend Detection Hub</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                        <div className="text-2xl font-bold text-emerald-500">{result.trend_detection_performance.correct_trends}</div>
                        <Text variant="label" className="text-[8px] opacity-50 uppercase">Correct</Text>
                      </div>
                      <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-center">
                        <div className="text-2xl font-bold text-destructive">{result.trend_detection_performance.incorrect_trends}</div>
                        <Text variant="label" className="text-[8px] opacity-50 uppercase">Incorrect</Text>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Success Ratio</span>
                        <span>{Math.round((parseInt(result.trend_detection_performance.correct_trends) / (parseInt(result.trend_detection_performance.correct_trends) + parseInt(result.trend_detection_performance.incorrect_trends))) * 100)}%</span>
                      </div>
                      <Progress 
                        value={Math.round((parseInt(result.trend_detection_performance.correct_trends) / (parseInt(result.trend_detection_performance.correct_trends) + parseInt(result.trend_detection_performance.incorrect_trends))) * 100)} 
                        className="h-1.5 bg-muted/20" 
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Integrity Alerts */}
                <Card className="glass-card border-none shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-16 w-16 text-amber-500" />
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Integrity Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.alerts_flags.map((alert, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <Text variant="caption" className="text-muted-foreground leading-relaxed">{alert}</Text>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[3rem] border border-secondary/20 bg-secondary/5 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-[2rem] bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="h-8 w-8 text-secondary" />
                  </div>
                  <Text variant="h4" className="font-bold">Model Versioning</Text>
                  <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                    Analyzing benchmarks for <strong>Analyst Kernel v4.2.0</strong>. Current drift is within the standard platform tolerance of ±2.5%.
                  </Text>
                  <Button variant="link" className="text-secondary font-bold text-xs" asChild>
                    <a href="/admin/health">Infrastructure Telemetry <ArrowRight className="ml-1 h-3 w-3" /></a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
