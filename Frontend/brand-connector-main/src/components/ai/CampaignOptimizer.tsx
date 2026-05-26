'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  IndianRupee, 
  Youtube, 
  Check, 
  X, 
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OptimizationSuggestion {
  id: string;
  type: 'TIMELINE' | 'BUDGET' | 'PLATFORM';
  title: string;
  description: string;
  benefit: string;
  icon: any;
  color: string;
  bg: string;
}

const INITIAL_SUGGESTIONS: OptimizationSuggestion[] = [
  {
    id: 'opt_1',
    type: 'TIMELINE',
    title: 'Tight Deadline Detected',
    description: 'Your submission deadline is currently set to 5 days. Historical data shows higher quality content with 8 days.',
    benefit: '87% of similar successful campaigns extended by 3 days.',
    icon: Clock,
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  {
    id: 'opt_2',
    type: 'BUDGET',
    title: 'Budget Alignment',
    description: 'The average rate for Tech creators in your target tier is 15% higher than your current offer.',
    benefit: 'Increase budget to attract 3.2x more high-match applicants.',
    icon: IndianRupee,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    id: 'opt_3',
    type: 'PLATFORM',
    title: 'Channel Expansion',
    description: 'Your audience has a 65% overlap with YouTube Tech communities not currently targeted.',
    benefit: 'Adding YouTube Dedicated Videos will increase reach by 40%.',
    icon: Youtube,
    color: 'text-red-600',
    bg: 'bg-red-50'
  }
];

export function CampaignOptimizer() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>(INITIAL_SUGGESTIONS);

  const handleAccept = (id: string, title: string) => {
    toast({
      title: "Optimization Applied",
      description: `Applied changes for: ${title}. Your campaign is being updated.`,
    });
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleDismiss = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary fill-primary/20" />
            Campaign Optimizer
          </h2>
          <p className="text-xs text-slate-500 font-medium">Real-time AI suggestions to maximize your project ROI.</p>
        </div>
        <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 py-1">
          {suggestions.length} OPPORTUNITIES
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, idx) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.3 }}
              layout
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white group ring-1 ring-slate-100">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Visual Indicator */}
                    <div className={cn("w-full md:w-2 shrink-0 transition-colors", suggestion.bg)} />
                    
                    <div className="flex-1 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", suggestion.bg, suggestion.color)}>
                        <suggestion.icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900">{suggestion.title}</h4>
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-400">
                            {suggestion.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-lg">
                            <TrendingUp className="h-3 w-3" />
                            Efficiency Lift: +12%
                          </div>
                          <p className="text-[11px] text-primary font-bold italic">{suggestion.benefit}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1 md:flex-none rounded-xl font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 px-4"
                          onClick={() => handleDismiss(suggestion.id)}
                        >
                          <X className="h-4 w-4 mr-1.5" /> Dismiss
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 md:flex-none rounded-xl font-black h-10 px-6 shadow-lg shadow-primary/10"
                          onClick={() => handleAccept(suggestion.id, suggestion.title)}
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Optimize Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
        <Sparkles className="absolute -top-4 -right-4 h-24 w-24 text-white/5 group-hover:scale-110 transition-transform" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
              <Lightbulb className="h-5 w-5 text-yellow-400 fill-yellow-400/20" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">Strategic Insight</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Campaigns with AI-optimized budgets fill 40% faster on average.</p>
            </div>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/10 h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest">
            Audit History <ArrowUpRight className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
