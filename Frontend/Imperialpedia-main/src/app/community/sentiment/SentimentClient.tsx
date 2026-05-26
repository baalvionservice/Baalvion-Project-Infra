'use client';

import React, { useEffect, useState } from 'react';
import { AssetSentiment, UserSentimentVote } from '@/types/community';
import { communityService } from '@/services/data/community-service';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Loader2, 
  Search, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  Target,
  Sparkles,
  ChevronRight,
  Flame,
  Globe,
  Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AssetSentimentCard } from '@/modules/community/components/AssetSentimentCard';
import { SentimentVoteHistory } from '@/modules/community/components/SentimentVoteHistory';
import { cn } from '@/lib/utils';

/**
 * Community Market Sentiment Hub Client.
 * Specialized terminal interface for visualizing and participating in crowd perception cycles.
 */
export function SentimentClient() {
  const [assets, setAssets] = useState<AssetSentiment[]>([]);
  const [history, setHistory] = useState<UserSentimentVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Global Pulse');

  useEffect(() => {
    async function loadData() {
      try {
        const [assetsRes, historyRes] = await Promise.all([
          communityService.getAssetSentiment(),
          communityService.getUserSentimentHistory()
        ]);
        if (assetsRes.data) setAssets(assetsRes.data);
        if (historyRes.data) setHistory(historyRes.data);
      } catch (e) {
        console.error('Sentiment sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.ticker.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [
    "Global Pulse",
    "Most Bullish",
    "Most Bearish",
    "High Velocity",
    "Equities",
    "Crypto"
  ];

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Psychology Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Activity className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Crowdsourced Intelligence</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Market Sentiment Pulse</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1 max-w-xl">
            Real-time visual telemetry of community perception. Track the divergence between retail emotion and market trajectory.
          </Text>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search asset nodes..." 
              className="pl-10 h-11 bg-card/30 border-white/10 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl h-11 border-white/10 bg-card/30 font-bold text-xs gap-2">
            <Filter className="h-4 w-4" /> Refine Matrix
          </Button>
        </div>
      </header>

      {/* Main Orchestration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* DISCOVERY AREA */}
        <div className="lg:col-span-8 space-y-10">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-8">
            <div className="overflow-x-auto no-scrollbar border-b border-white/5 pb-1">
              <TabsList className="bg-transparent border-none p-0 h-12 justify-start gap-8">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="bg-transparent border-none rounded-none px-0 h-full font-bold text-xs uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeCategory} className="mt-0 animate-in fade-in duration-500">
              {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredAssets.map(asset => (
                    <AssetSentimentCard key={asset.id} asset={asset} />
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center border-2 border-dashed rounded-[3rem] border-white/5 bg-card/10">
                  <Text variant="bodySmall" className="text-muted-foreground italic">No matching sentiment nodes localized.</Text>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* TRENDING SIGNALS SECTION */}
          <section className="space-y-6 pt-10 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">Extreme Signals</Text>
                <Text variant="caption" className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]">High-Density Sentiment Clusters</Text>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Most Bullish', asset: 'Bitcoin', score: '74%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                { label: 'Most Bearish', asset: 'S&P 500', score: '49%', icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/5' },
                { label: 'High Velocity', asset: 'Tesla', score: '+12%', icon: Activity, color: 'text-primary', bg: 'bg-primary/5' },
              ].map((sig) => (
                <Card key={sig.label} className={cn("glass-card border-none shadow-xl relative overflow-hidden group hover:border-white/20 transition-all", sig.bg)}>
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                    <sig.icon size={64} />
                  </div>
                  <CardContent className="p-6 flex items-center gap-4 relative z-10">
                    <div className={cn("p-3 rounded-2xl bg-background/50 border border-white/5 shadow-inner", sig.color)}>
                      <sig.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest block mb-0.5">{sig.label}</Text>
                      <Text variant="body" weight="bold">{sig.asset}</Text>
                      <div className={cn("text-xl font-bold tracking-tighter mt-1", sig.color)}>{sig.score}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* SIDEBAR AREA */}
        <aside className="lg:col-span-4 space-y-10">
          <SentimentVoteHistory history={history} />

          <Card className="glass-card border-none bg-primary/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="h-32 w-32 text-primary rotate-12" />
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Target className="h-4 w-4" />
                <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Sentiment Alpha</Text>
              </div>
              <CardTitle className="text-2xl font-bold">Predictive Signals</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed italic block">
                "Crowd sentiment often acts as a **contrarian indicator** during extreme peaks. Watch for 'Strong Bullish' clusters coinciding with institutional distribution nodes."
              </Text>
              <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary h-11 font-bold text-xs uppercase group/btn">
                Launch Divergence Audit <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
              <Globe className="h-24 w-24 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Integrity Verified
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Imperialpedia uses a **Reputation-Weighted Voting** algorithm. Votes from users with higher authority scores carry 2.4x more weight in the aggregate pulse.
            </Text>
            <Button variant="link" className="p-0 h-auto text-secondary text-xs font-bold group/link" asChild>
              <a href="/community/leaderboard">
                Review My Reputation <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </a>
            </Button>
          </div>

          <Card className="glass-card border-none bg-background/30 shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> Watchlist Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'NVIDIA', ticker: 'NVDA', score: 92 },
                { name: 'Microsoft', ticker: 'MSFT', score: 68 },
                { name: 'Amazon', ticker: 'AMZN', score: 78 },
              ].map((item) => (
                <div key={item.ticker} className="space-y-2 group">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                    <span className="text-primary">{item.score}% Bullish</span>
                  </div>
                  <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
