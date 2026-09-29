
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Check, Plus, Loader2, Info } from 'lucide-react';
import { useMatchingStore } from '@/store/useMatchingStore';
import { useCreatorStore } from '@/store/useCreatorStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MatchingPanelProps {
  dealId: string;
}

export function MatchingPanel({ dealId }: MatchingPanelProps) {
  const { matches, loading, fetchMatches, autoShortlistTop } = useMatchingStore();
  const { shortlistCreator } = useCreatorStore();

  const handleManualShortlist = (creatorId: string) => {
    shortlistCreator(creatorId, dealId);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-emerald-500 text-white";
    if (score >= 70) return "bg-orange-400 text-white";
    return "bg-slate-400 text-white";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent Match";
    if (score >= 70) return "Good Match";
    return "Partial Match";
  };

  if (loading && matches.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Calculating Matches...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-500 mb-4">Let AI find the best talent for this brand.</p>
        <Button onClick={() => fetchMatches(dealId)} size="sm" className="rounded-xl font-bold">
          Run Matching Engine
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary" /> AI Recommended Talent
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={loading}
          onClick={() => autoShortlistTop(dealId)}
          className="h-7 text-[9px] font-black text-primary uppercase p-0 hover:bg-transparent"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1 fill-primary" />}
          Auto-Shortlist Top 5
        </Button>
      </div>

      <div className="space-y-3">
        {matches.map((match, idx) => (
          <motion.div
            key={match.creator.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarImage src={match.creator.avatar} />
                <AvatarFallback>{match.creator.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-bold text-slate-900 truncate">{match.creator.name}</h4>
                  <Badge className={cn("text-[8px] font-black h-4 px-1.5 border-none", getScoreBadge(match.score))}>
                    {match.score}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {match.matchReasons.map((reason, i) => (
                    <span key={i} className="text-[9px] text-slate-400 font-medium">
                      • {reason}
                    </span>
                  ))}
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleManualShortlist(match.creator.id)}
                      className="h-8 w-8 rounded-full text-slate-300 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add to Shortlist</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
