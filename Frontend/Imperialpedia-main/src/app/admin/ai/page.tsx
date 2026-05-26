
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, Sparkles, Zap, Target, ArrowRight, Loader2, Send, Settings2, CheckCircle2, Info
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function AIContentLab() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // Simulate Claude 3.5 Handshake
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    setResult(`Analyzed Topic: "${prompt}"\n\nIntelligence Summary: The current yield curve inversion signals a significant decoupling of short-term interest rates from long-tail inflation expectations. Institutional liquidity nodes are currently buffering the impact, but a structural shift is expected by Q4 2026.`);
    toast({ title: "Synthesis Complete", description: "AI intelligence node ready for human audit." });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Brain className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Intelligence Synthesis</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">AI Content Lab</Text>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary h-10 px-4 gap-2 font-bold text-[10px] uppercase">
            <Zap size={14} className="animate-pulse" /> Claude 3.5 Node: Active
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8">
              <CardTitle>Research Orchestrator</CardTitle>
              <CardDescription>Dispatch instructions to the Analyst Kernel for automated research generation.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Textarea 
                  placeholder="Input research parameters (e.g. Analyze the Q2 yield divergence)..." 
                  className="min-h-[150px] bg-background/50 border-white/5 resize-none leading-relaxed text-lg italic p-6"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                />
                <Button 
                  onClick={handleGenerate} 
                  disabled={generating || !prompt.trim()} 
                  className="w-full h-14 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-[1.01] active:scale-100"
                >
                  {generating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  {generating ? 'Traversing Global Wires...' : 'Synthesize Intelligence Node'}
                </Button>
              </div>

              {result && (
                <div className="mt-10 p-8 rounded-[2.5rem] bg-background border border-primary/20 animate-in slide-in-from-top-4 duration-500 relative">
                  <div className="absolute top-4 right-4"><CheckCircle2 className="text-emerald-500" /></div>
                  <Text variant="body" className="leading-relaxed whitespace-pre-wrap">{result}</Text>
                  <div className="pt-8 border-t border-white/5 mt-8 flex justify-end gap-3">
                    <Button variant="ghost" className="rounded-xl">Discard</Button>
                    <Button className="rounded-xl bg-primary shadow-lg">Commit to Editorial Queue <ArrowRight size={14} className="ml-2" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">Scoring Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Readability Index', value: 92 },
                { label: 'SEO Authority Alignment', value: 85 },
                { label: 'Factual Handshake Precision', value: 98 },
              ].map(stat => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>{stat.label}</span>
                    <span className="text-foreground">{stat.value}%</span>
                  </div>
                  <Progress value={stat.value} className="h-1 bg-white/5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest">
              <Target className="h-4 w-4" /> Instruction Logic
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "AI-generated nodes are automatically cross-referenced with the **Imperialpedia Glossary**. Definitions are auto-linked during the publish handshake."
            </Text>
          </div>
        </aside>
      </div>
    </div>
  );
}
