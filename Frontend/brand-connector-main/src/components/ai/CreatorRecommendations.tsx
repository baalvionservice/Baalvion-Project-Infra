'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCcw, 
  Zap, 
  Star, 
  Users, 
  TrendingUp, 
  MapPin, 
  ChevronRight, 
  Plus, 
  Bookmark,
  CheckCircle2,
  Send,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Mock data for recommendations
const INITIAL_RECOMMENDATIONS = [
  {
    id: 'rec_1',
    name: 'Sarah Chen',
    handle: '@sarah_tech',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    matchScore: 98,
    niche: 'Tech & Gadgets',
    reach: '850k',
    er: '5.8%',
    reasons: ['Same niche as top performer', 'Budget match'],
    isVerified: true
  },
  {
    id: 'rec_2',
    name: 'Alex Rivers',
    handle: '@alex_creates',
    avatar: 'https://picsum.photos/seed/alex/100/100',
    matchScore: 94,
    niche: 'Lifestyle',
    reach: '320k',
    er: '7.2%',
    reasons: ['High engagement in your target city', 'New rising star'],
    isVerified: true
  },
  {
    id: 'rec_3',
    name: 'Elena Vance',
    handle: '@elena_style',
    avatar: 'https://picsum.photos/seed/elena/100/100',
    matchScore: 91,
    niche: 'Fashion',
    reach: '1.2M',
    er: '4.1%',
    reasons: ['Audience overlap with Q3 goals', 'Similar to @sarah_tech'],
    isVerified: true
  }
];

export function CreatorRecommendations() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);
  const [shortlisted, setShortlisted] = useState<string[]>([]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate daily refresh logic
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Picks Refreshed",
        description: "AI has analyzed your latest campaign performance.",
      });
    }, 1500);
  };

  const toggleShortlist = (id: string) => {
    setShortlisted(prev => {
      const exists = prev.includes(id);
      if (!exists) {
        toast({
          title: "Added to Shortlist",
          description: "This creator is now in your potential talent pool.",
        });
      }
      return exists ? prev.filter(item => item !== id) : [...prev, id];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary fill-primary/20" />
            AI Picks for You
          </h2>
          <p className="text-xs text-slate-500 font-medium">Daily suggestions based on your campaign ROI and objectives.</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="rounded-xl h-9 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="mr-2 h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {!isRefreshing ? (
            recommendations.map((creator, idx) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.1 }}
                layout
              >
                <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white group ring-1 ring-slate-100 flex flex-col h-full">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative group/avatar">
                        <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-md ring-4 ring-primary/5">
                          <AvatarImage src={creator.avatar} />
                          <AvatarFallback className="bg-primary/5 text-primary font-black">{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        {creator.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-50">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-primary/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-primary/10">
                          <Zap className="h-3 w-3 text-primary fill-primary" />
                          <span className="text-[10px] font-black text-primary uppercase">{creator.matchScore}% Match</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-8 w-8 rounded-full transition-all",
                            shortlisted.includes(creator.id) ? "bg-orange-100 text-orange-600" : "text-slate-300 hover:bg-slate-100 hover:text-orange-500"
                          )}
                          onClick={() => toggleShortlist(creator.id)}
                        >
                          <Bookmark className={cn("h-4 w-4", shortlisted.includes(creator.id) && "fill-current")} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors truncate">
                        {creator.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{creator.handle}</p>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-2 flex-1 space-y-6">
                    <div className="flex flex-wrap gap-1.5">
                      {creator.reasons.map((reason, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-500 border-none font-bold text-[9px] uppercase tracking-tighter px-2 h-5">
                          {reason}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Users className="h-2.5 w-2.5" /> Reach
                        </p>
                        <p className="text-sm font-black text-slate-900">{creator.reach}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <TrendingUp className="h-2.5 w-2.5 text-emerald-500" /> Engagement
                        </p>
                        <p className="text-sm font-black text-emerald-600">{creator.er}</p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 mt-auto flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
                    <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-400 p-0 h-auto hover:text-primary transition-colors" asChild>
                      <Link href={`/creator/${creator.handle.replace('@', '')}`}>
                        View Profile <ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button size="sm" className="rounded-xl font-bold h-9 px-6 shadow-lg shadow-primary/20">
                      <Send className="mr-2 h-3.5 w-3.5" /> Invite
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Analyzing marketplace data...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
