'use client';

import React, { useEffect, useState } from 'react';
import { UserPersonalizedData, FeedItem, AssetRecommendation } from '@/types/user-system';
import { dashboardService } from '@/services/data/dashboard-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Bookmark, 
  Heart, 
  Clock, 
  User, 
  ArrowRight, 
  Loader2, 
  Zap, 
  ShieldAlert, 
  Search,
  BookOpen,
  Layers,
  Activity,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

/**
 * User Personalized Feed & Recommendations Client Hub.
 * Specialized discovery suite featuring AI-synthesized content and asset matches.
 */
export function RecommendationsClient() {
  const [data, setData] = useState<UserPersonalizedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await dashboardService.getPersonalizedData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('Failed to sync discovery nodes', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = (id: string) => {
    setSavedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    toast({
      title: savedItems.includes(id) ? "Node Removed" : "Intelligence Saved",
      description: "Synchronization complete with your personal index.",
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Calibrating Discovery Matrix...
        </Text>
      </div>
    );
  }

  const getFeedIcon = (type: string) => {
    switch (type) {
      case 'article': return <BookOpen className="h-5 w-5 text-primary" />;
      case 'guide': return <Zap className="h-5 w-5 text-secondary" />;
      case 'glossary_term': return <Layers className="h-5 w-5 text-emerald-500" />;
      default: return <Sparkles className="h-5 w-5 text-primary" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Uptrend': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'Downtrend': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'High': return <Badge variant="destructive" className="font-bold text-[9px] px-2 h-5">HIGH RISK</Badge>;
      case 'Moderate': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[9px] px-2 h-5">MODERATE</Badge>;
      default: return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[9px] px-2 h-5">STABLE</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-24">
      
      {/* PERSONALIZED FEED COLUMN */}
      <div className="lg:col-span-8 space-y-8">
        <header className="flex items-center justify-between px-2">
          <div>
            <Text variant="h2" className="text-2xl font-bold">Intelligence Feed</Text>
            <Text variant="bodySmall" className="text-muted-foreground">Tailored research based on your interest matrix.</Text>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-bold text-xs">
            Refine Interests <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </header>

        <div className="space-y-6">
          {data.feed.map((item) => (
            <Card key={item.id} className="glass-card border-none shadow-xl group hover:border-primary/30 transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-10 w-10 rounded-xl", savedItems.includes(item.id) ? "text-primary" : "text-muted-foreground")}
                  onClick={() => handleSave(item.id)}
                >
                  <Bookmark className={cn("h-5 w-5", savedItems.includes(item.id) && "fill-current")} />
                </Button>
              </div>
              
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="shrink-0">
                    <div className="p-4 rounded-[1.5rem] bg-background/50 border border-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      {getFeedIcon(item.type)}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary h-6 px-3">
                        {item.type.replace('_', ' ')}
                      </Badge>
                      {item.category && (
                        <Text variant="caption" className="text-muted-foreground uppercase font-bold text-[9px] tracking-tighter">
                          {item.category}
                        </Text>
                      )}
                    </div>

                    <div>
                      <Text variant="h3" className="text-2xl font-bold group-hover:text-primary transition-colors leading-tight mb-2">
                        {item.title}
                      </Text>
                      <Text variant="bodySmall" className="text-muted-foreground leading-relaxed line-clamp-2 italic">
                        "{item.preview}"
                      </Text>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <User className="h-3.5 w-3.5 text-primary" />
                          {item.author}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {item.date}
                        </div>
                      </div>
                      <Button variant="ghost" className="text-primary font-bold text-xs gap-2 group/btn">
                        Read Analysis <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-dashed border-white/10 text-muted-foreground hover:text-primary font-bold hover:bg-primary/5">
          Load deeper intelligence nodes
        </Button>
      </div>

      {/* RECOMMENDATIONS COLUMN */}
      <div className="lg:col-span-4 space-y-8">
        <header className="px-2">
          <Text variant="h2" className="text-2xl font-bold">Strategic Matches</Text>
          <Text variant="bodySmall" className="text-muted-foreground">AI-vetted assets for your risk profile.</Text>
        </header>

        <div className="space-y-4">
          {data.asset_recommendations.map((rec) => (
            <Card key={rec.id} className="glass-card border-none shadow-xl hover:border-secondary/30 transition-all group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-background/50 border border-white/5 flex items-center justify-center font-mono font-bold text-xs text-primary shadow-inner">
                      {rec.symbol}
                    </div>
                    <div>
                      <Text variant="body" weight="bold" className="block">{rec.asset_name}</Text>
                      <div className="flex items-center gap-2 mt-1">
                        {getTrendIcon(rec.trend)}
                        <Text variant="caption" className="text-[10px] font-bold text-muted-foreground uppercase">{rec.trend}</Text>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono">${rec.price.toLocaleString()}</div>
                    {getRiskBadge(rec.risk_level)}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Analyst Confidence</span>
                    <span className="text-secondary">{Math.round(rec.confidence_score * 100)}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${rec.confidence_score * 100}%` }} />
                  </div>
                </div>

                <Button variant="outline" className="w-full rounded-xl h-10 border-white/10 hover:bg-secondary hover:text-secondary-foreground font-bold text-[10px] uppercase">
                  Launch Asset Summary
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Global Strategy Context */}
        <Card className="glass-card border-none bg-secondary/5 border-secondary/20 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="h-24 w-24 text-secondary" />
          </div>
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest">
              <CheckCircle2 className="h-4 w-4" /> Recommendation Logic
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
              "Your current matching engine is set to **Balanced Growth**. Assets are weighted against historical volatility and institutional buy-side liquidity clusters."
            </Text>
            <Button variant="link" className="p-0 h-auto text-secondary font-bold text-xs group/link" asChild>
              <Link href="/dashboard/settings">
                Adjust Risk Parameters <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Support Node */}
        <div className="p-8 rounded-[3rem] bg-card/30 border border-white/5 text-center space-y-4">
          <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Search className="h-8 w-8" />
          </div>
          <Text variant="bodySmall" weight="bold">Missing a specific sector?</Text>
          <Text variant="caption" className="text-muted-foreground leading-relaxed block">
            Search our 1M+ knowledge nodes to manually add sectors to your preference matrix.
          </Text>
          <Button variant="outline" className="w-full rounded-2xl h-12 border-primary/20 text-primary font-bold">Global Search Hub</Button>
        </div>
      </div>
    </div>
  );
}
