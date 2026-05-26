'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCcw, 
  Clock, 
  Hash, 
  TrendingUp, 
  Lightbulb, 
  UserCheck, 
  PlayCircle, 
  Compass 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AIInsightsPanel() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate AI analysis delay
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const insights = [
    {
      title: "Optimal Posting Window",
      value: "6:30 PM - 8:45 PM IST",
      description: "Based on your highest audience activity on Wednesdays.",
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Trending Hashtags",
      value: "#SmartHomeAI, #BaalvionReview",
      description: "Growing 15% faster in your primary niche this week.",
      icon: Hash,
      color: "text-pink-500",
      bg: "bg-pink-50"
    },
    {
      title: "Top Content Format",
      value: "Short-form Unboxings",
      description: "Engagement rate is 2.4x higher than standard reels.",
      icon: PlayCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      title: "Niche Opportunity",
      value: "Sustainable Smart-Tech",
      description: "Low competition, high brand demand predicted for Q4.",
      icon: Compass,
      color: "text-orange-500",
      bg: "bg-orange-50"
    },
    {
      title: "Profile Boost",
      value: "Update 2nd Sample",
      description: "Replacing your older tech sample could increase match rate by 12%.",
      icon: UserCheck,
      color: "text-primary",
      bg: "bg-primary/5"
    }
  ];

  return (
    <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">AI Insights</CardTitle>
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-tighter">
                AI-Generated
              </Badge>
            </div>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Personalized Growth Strategy</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-xl h-9 w-9", isRefreshing && "bg-slate-100")}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw className={cn("h-4 w-4 text-slate-400", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Analyzing Reach</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Processing 1.2M data points...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="divide-y divide-slate-50"
            >
              {insights.map((item, i) => (
                <div key={i} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors group">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</p>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{item.value}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{item.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <div className="p-4 bg-primary/5 border-t border-primary/10">
        <Button variant="link" className="w-full text-[10px] font-black uppercase text-primary p-0 h-auto gap-2 group">
          <Lightbulb className="h-3 w-3" /> 
          View Weekly Strategy Report
          <TrendingUp className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>
    </Card>
  );
}
