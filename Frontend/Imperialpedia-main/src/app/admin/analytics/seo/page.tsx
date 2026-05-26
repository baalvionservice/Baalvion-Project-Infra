'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Globe, 
  TrendingUp, 
  Search, 
  ArrowLeft, 
  ArrowUpRight, 
  BarChart3, 
  MousePointer2, 
  Link as LinkIcon, 
  Loader2,
  Calendar,
  Download,
  ChevronRight,
  TrendingDown,
  Minus,
  Activity,
  Zap,
  Target,
  FileText,
  ShieldCheck,
  SearchX,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/data/analytics-service';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SeoAnalytics } from '@/types';

/**
 * SEO Authority & Search Performance Dashboard.
 * Specialized terminal for tracking search visibility, keyword rankings, and organic authority growth.
 * Aligned with Prompt 74.
 */
export default function SeoAuthorityDashboardPage() {
  const [data, setData] = useState<SeoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [keywordSearch, setKeywordSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getSeoAnalytics();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error('SEO Intelligence Sync Failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
          Syncing Search Engine Intelligence...
        </Text>
      </div>
    );
  }

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val);

  const getTrendIcon = (change: string) => {
    if (change.includes('+')) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (change.includes('-')) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const filteredKeywords = data.keywords.filter(k => 
    k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()) ||
    k.target_article.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Globe className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Organic Authority Index</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">SEO Intelligence</Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-card/30">
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Outlook
          </Button>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary">
            <Download className="mr-2 h-4 w-4" /> Export SEO Audit
          </Button>
        </div>
      </header>

      {/* High-Level Search Metrics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Indexed Pages', value: formatCompact(data.indexedPages), icon: Globe, color: 'text-primary' },
          { label: 'Organic Traffic', value: formatCompact(data.total_organic_traffic), icon: Activity, color: 'text-secondary' },
          { label: 'Top Keywords', value: formatCompact(data.top_keywords_count), icon: Search, color: 'text-primary' },
          { label: 'Total Backlinks', value: formatCompact(data.backlinks), icon: LinkIcon, color: 'text-secondary' },
          { label: 'Avg. Position', value: `#${data.avgPosition}`, icon: Target, color: 'text-emerald-500' },
        ].map((m) => (
          <Card key={m.label} className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={cn("h-3.5 w-3.5", m.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tighter">{m.value}</div>
              <div className="flex items-center text-[9px] text-emerald-500 font-bold mt-1 uppercase">
                <ArrowUpRight className="h-2.5 w-2.5 mr-1" /> Active Scaling
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Organic Traffic Momentum Visualization */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Traffic Trajectory
                </CardTitle>
                <CardDescription>Daily organic discovery velocity across the 1M+ node index.</CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold h-7 px-4">LIVE PULSE</Badge>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends}>
                  <defs>
                    <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8272F2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.split('-')[2]}
                  />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area 
                    type="monotone" 
                    dataKey="organic_traffic" 
                    name="Organic Traffic"
                    stroke="#8272F2" 
                    fillOpacity={1} 
                    fill="url(#colorOrganic)" 
                    strokeWidth={3}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    name="SERP Clicks"
                    stroke="#69B9FF" 
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Keyword Ranking Tracker Matrix */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Search className="h-5 w-5 text-secondary" /> Keyword Ranking Tracker
                </CardTitle>
                <CardDescription>Auditing high-intent queries and their landing node positions.</CardDescription>
              </div>
              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Filter query matrix..." 
                  className="pl-10 h-10 bg-background/50 border-white/10 rounded-xl text-xs" 
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Search Query (Keyword)</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Position</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Volume</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Trajectory</TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Target Article</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeywords.map((k) => (
                    <TableRow key={k.keyword} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/90">{k.keyword}</span>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{k.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-primary">#{k.ranking_position}</TableCell>
                      <TableCell className="text-center font-mono text-xs opacity-70">{formatCompact(k.search_volume)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold">
                          {getTrendIcon(k.ranking_change)}
                          {k.ranking_change === '0' ? 'Stable' : k.ranking_change}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Link href="/articles" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">
                          {k.target_article} <ExternalLink className="h-2 w-2 ml-1 inline" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Sidebar: Backlinks & Strategic Insights */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Backlink Monitor Panel */}
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Authority Matrix (Backlinks)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/5 bg-secondary/5">
                <div className="space-y-1">
                  <Text variant="label" className="text-[8px] opacity-50 font-bold uppercase">Referring Domains</Text>
                  <div className="text-2xl font-bold tracking-tighter">12.4k</div>
                </div>
                <div className="space-y-1 text-right">
                  <Text variant="label" className="text-[8px] opacity-50 font-bold uppercase">New (30d)</Text>
                  <div className="text-2xl font-bold tracking-tighter text-emerald-500">+420</div>
                </div>
              </div>
              <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto no-scrollbar">
                {data.backlink_sources.map((link, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-secondary">
                        <Globe className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block">{link.source}</span>
                        <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">{link.date}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-mono h-6 px-3">DA {link.authority}</Badge>
                  </div>
                ))}
              </div>
              <CardFooter className="p-4 border-t border-white/5 bg-muted/10">
                <Button variant="ghost" className="w-full h-10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none">
                  Review All Referral Nodes
                </Button>
              </CardFooter>
            </CardContent>
          </Card>

          {/* SEO Opportunity Insights */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold text-sm uppercase tracking-widest">Growth Opportunities</Text>
                <Text variant="caption" className="text-muted-foreground font-bold text-[8px] uppercase">AI Content Strategist</Text>
              </div>
            </div>

            <div className="space-y-4">
              {data.opportunities.map((opt, i) => (
                <Card key={i} className="glass-card border-none bg-primary/5 hover:bg-primary/10 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50" />
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Text variant="bodySmall" weight="bold" className="text-foreground group-hover:text-primary transition-colors">{opt.title}</Text>
                        <Badge variant={opt.priority === 'High' ? 'destructive' : 'outline'} className="text-[7px] font-bold h-4 px-1.5 uppercase">{opt.priority}</Badge>
                      </div>
                      <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">"{opt.description}"</Text>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="glass-card border-none bg-secondary/5 border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <SearchX className="h-24 w-24 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest">
              <Zap className="h-4 w-4" /> Discovery Logic
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Identifying **Ranking Deterioration** in the "Fixed Income" hub. Competitive nodes from Reuters are outperforming on long-tail queries. Recommend H2/H3 node audits.
            </Text>
            <Button variant="link" className="p-0 h-auto w-fit text-secondary font-bold text-xs group/link">
              Launch Detailed Audit Matrix <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
            </Button>
          </Card>
        </aside>
      </div>

      {/* TOP PERFORMING SEARCH CONTENT LIST */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" /> Search Node Performance
            </CardTitle>
            <CardDescription>Top 50 intelligence nodes by monthly organic reach and authority depth.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-bold text-xs group">
            Full Index Audit <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Intelligence Title</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Avg. Rank</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Monthly Reach</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Backlink Depth</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Quality Node</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.top_search_content.map((content) => (
                <TableRow key={content.title} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <Text variant="bodySmall" weight="bold" className="text-foreground/90 group-hover:text-primary transition-colors leading-tight">{content.title}</Text>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-secondary">#{content.rank}</TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold">{formatCompact(content.traffic)}</TableCell>
                  <TableCell className="text-center font-mono text-xs opacity-70">{formatCompact(content.backlinks)}</TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${content.quality_score}%` }} />
                      </div>
                      <span className="text-xs font-bold font-mono text-emerald-500">{content.quality_score}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* STRATEGIC HUB FOOTER */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-3">
            <Text variant="h2" className="text-3xl font-bold tracking-tight">Search Visibility Verified</Text>
            <Text variant="body" className="text-muted-foreground leading-relaxed max-w-3xl">
              Platform authority is benchmarked against **Google Search Console** and **Ahrefs** institutional endpoints. Programmatic sitemaps are synchronized every 60 minutes to ensure 100% indexable node health.
            </Text>
          </div>
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 scale-105 active:scale-95 transition-all">
            Initiate Bulk Sitemap Cycle
          </Button>
        </div>
      </Card>
    </div>
  );
}
