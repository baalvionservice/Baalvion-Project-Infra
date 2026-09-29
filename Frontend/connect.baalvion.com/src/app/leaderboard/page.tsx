'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  IndianRupee,
  TrendingUp,
  Briefcase,
  Filter,
  Search,
  Zap,
  Medal,
  Crown,
  ChevronRight,
  ArrowUpRight,
  Star,
  Globe,
  Instagram,
  Youtube,
  Music2,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { CREATOR_NICHES, SOCIAL_PLATFORMS } from '@/constants';
import { cn } from '@/lib/utils';

// Mock Leaderboard Data
const MOCK_LEADERBOARD = [
  { id: '1', name: 'Sarah Chen', handle: 'sarah_tech', niche: 'Tech & Gadgets', score: 985, campaigns: 42, earnings: 1250000, er: 8.2, platform: 'YouTube', image: 'https://picsum.photos/seed/sarah/200/200' },
  { id: '2', name: 'Alex Rivers', handle: 'alex_creates', niche: 'Photography', score: 962, campaigns: 38, earnings: 850000, er: 6.5, platform: 'Instagram', image: 'https://picsum.photos/seed/alex/200/200' },
  { id: '3', name: 'Marcus Thorne', handle: 'm_fitness', niche: 'Fitness & Wellness', score: 945, campaigns: 56, earnings: 920000, er: 9.1, platform: 'TikTok', image: 'https://picsum.photos/seed/marcus/200/200' },
  { id: '4', name: 'Elena Rodriguez', handle: 'elena_style', niche: 'Fashion & Style', score: 928, campaigns: 29, earnings: 640000, er: 5.4, platform: 'Instagram', image: 'https://picsum.photos/seed/elena/200/200' },
  { id: '5', name: 'Priya Sharma', handle: 'priya_explores', niche: 'Travel & Adventure', score: 915, campaigns: 31, earnings: 780000, er: 4.8, platform: 'YouTube', image: 'https://picsum.photos/seed/priya/200/200' },
  { id: '6', name: 'James Wilson', handle: 'j_vlogs', niche: 'Lifestyle', score: 890, campaigns: 45, earnings: 520000, er: 7.2, platform: 'YouTube', image: 'https://picsum.photos/seed/james/200/200' },
  { id: '7', name: 'Chloe Dubois', handle: 'chloe_beauty', niche: 'Beauty & Personal Care', score: 875, campaigns: 24, earnings: 410000, er: 6.1, platform: 'Instagram', image: 'https://picsum.photos/seed/chloe/200/200' },
  { id: '8', name: 'David Miller', handle: 'dave_gadgets', niche: 'Tech & Gadgets', score: 862, campaigns: 19, earnings: 320000, er: 5.9, platform: 'YouTube', image: 'https://picsum.photos/seed/david/200/200' },
  { id: '9', name: 'Sophie Laurent', handle: 'sophie_cooks', niche: 'Food & Cooking', score: 845, campaigns: 22, earnings: 280000, er: 8.5, platform: 'TikTok', image: 'https://picsum.photos/seed/sophie/200/200' },
  { id: '10', name: 'Robert Vance', handle: 'vance_home', niche: 'Home Decor', score: 820, campaigns: 15, earnings: 190000, er: 4.2, platform: 'Instagram', image: 'https://picsum.photos/seed/robert/200/200' },
];

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [metric, setMetric] = useState<'score' | 'campaigns' | 'earnings' | 'er'>('score');
  const [niche, setNiche] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [timePeriod, setTimePeriod] = useState('monthly');

  const filteredAndSorted = useMemo(() => {
    return MOCK_LEADERBOARD
      .filter(c => {
        const matchNiche = niche === 'all' || c.niche === niche;
        const matchPlatform = platform === 'all' || c.platform === platform;
        return matchNiche && matchPlatform;
      })
      .sort((a, b) => b[metric] - a[metric]);
  }, [metric, niche, platform]);

  const topThree = filteredAndSorted.slice(0, 3);
  const remaining = filteredAndSorted.slice(3);

  const getMetricLabel = (m: string) => {
    switch (m) {
      case 'score': return 'AI Score';
      case 'campaigns': return 'Campaigns';
      case 'earnings': return 'Earnings';
      case 'er': return 'Engagement';
      default: return '';
    }
  };

  const formatMetricValue = (val: number, m: string) => {
    if (m === 'earnings') return `₹${val.toLocaleString()}`;
    if (m === 'er') return `${val}%`;
    return val.toLocaleString();
  };

  const getPlatformIcon = (p: string) => {
    switch (p) {
      case 'Instagram': return <Instagram className="h-3 w-3" />;
      case 'YouTube': return <Youtube className="h-3 w-3" />;
      case 'TikTok': return <Music2 className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Dynamic Background Decoration */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />

      <div className="container px-4 md:px-8 pt-12 max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-primary/20 shadow-sm">
              <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-black uppercase tracking-widest text-primary">Global Rankings</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
              Creator <span className="text-primary">Hall of Fame</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-xl font-medium leading-relaxed">
              Benchmarks based on verified performance data, brand feedback, and AI-driven engagement analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs defaultValue="monthly" onValueChange={setTimePeriod} className="bg-white p-1 rounded-2xl border shadow-sm">
              <TabsList className="bg-transparent border-none">
                <TabsTrigger value="weekly" className="rounded-xl px-6 font-bold">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-xl px-6 font-bold">Monthly</TabsTrigger>
                <TabsTrigger value="all-time" className="rounded-xl px-6 font-bold">All-Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
          <CardContent className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="space-y-1.5 min-w-[180px]">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rank By</label>
                <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score" className="font-bold">AI Performance Score</SelectItem>
                    <SelectItem value="campaigns" className="font-bold">Campaigns Completed</SelectItem>
                    <SelectItem value="earnings" className="font-bold">Total Earnings</SelectItem>
                    <SelectItem value="er" className="font-bold">Engagement Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-[180px]">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Niche</label>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-bold">All Categories</SelectItem>
                    {CREATOR_NICHES.slice(0, 10).map(n => (
                      <SelectItem key={n} value={n} className="font-bold">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-[180px]">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-bold">All Platforms</SelectItem>
                    {SOCIAL_PLATFORMS.slice(0, 5).map(p => (
                      <SelectItem key={p} value={p} className="font-bold">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {currentUser?.role === 'CREATOR' && (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-4 w-full lg:w-auto">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                  <Star className="h-5 w-5 text-white fill-current" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Your Rank</p>
                  <p className="text-xl font-black text-slate-900 mt-1">#14 <span className="text-xs text-slate-400 font-bold ml-1">TOP 2%</span></p>
                </div>
                <Button variant="ghost" size="icon" className="ml-2 rounded-full hover:bg-white transition-all">
                  <ChevronRight className="h-5 w-5 text-primary" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-12 pb-8">
          {/* Silver - Rank 2 */}
          <PodiumCard
            creator={topThree[1]}
            rank={2}
            metric={metric}
            metricLabel={getMetricLabel(metric)}
            formatVal={formatMetricValue}
            icon={<Medal className="h-6 w-6 text-slate-400 fill-slate-100" />}
            color="border-slate-200"
            delay={0.1}
          />

          {/* Gold - Rank 1 */}
          <PodiumCard
            creator={topThree[0]}
            rank={1}
            metric={metric}
            metricLabel={getMetricLabel(metric)}
            formatVal={formatMetricValue}
            icon={<Crown className="h-10 w-10 text-yellow-500 fill-yellow-200" />}
            color="border-yellow-400 ring-4 ring-yellow-400/20"
            isGold
            delay={0}
          />

          {/* Bronze - Rank 3 */}
          <PodiumCard
            creator={topThree[2]}
            rank={3}
            metric={metric}
            metricLabel={getMetricLabel(metric)}
            formatVal={formatMetricValue}
            icon={<Medal className="h-6 w-6 text-orange-600 fill-orange-100" />}
            color="border-orange-200"
            delay={0.2}
          />
        </div>

        {/* Main Table */}
        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="border-b bg-slate-50/50 p-8">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Rising Talent</CardTitle>
            <CardDescription>Top performers in the {niche === 'all' ? 'global' : niche} community.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 h-16">
                  <TableHead className="w-20 text-center font-black text-[10px] uppercase tracking-widest">Rank</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Creator</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest hidden md:table-cell">Niche</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest hidden lg:table-cell">Platform</TableHead>
                  <TableHead className="text-right pr-12 font-black text-[10px] uppercase tracking-widest">{getMetricLabel(metric)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {remaining.map((creator, i) => (
                    <motion.tr
                      key={creator.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24"
                    >
                      <TableCell className="text-center">
                        <span className="text-lg font-black text-slate-400 group-hover:text-primary transition-colors">#{i + 4}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 rounded-xl border shadow-sm">
                            <AvatarImage src={creator.image} />
                            <AvatarFallback>{creator.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-black text-slate-900 leading-none flex items-center gap-1.5">
                              {creator.name}
                              <CheckCircle2 className="h-3 w-3 text-blue-500" />
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">@{creator.handle}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="bg-white border text-[10px] font-black uppercase text-slate-500">
                          {creator.niche}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            {getPlatformIcon(creator.platform)}
                          </div>
                          <span className="text-xs font-bold text-slate-600">{creator.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-12">
                        <span className={cn(
                          "text-xl font-black",
                          metric === 'score' ? "text-primary" : "text-slate-900"
                        )}>
                          {formatMetricValue(creator[metric], metric)}
                        </span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PodiumCard({
  creator,
  rank,
  metric,
  metricLabel,
  formatVal,
  icon,
  color,
  isGold = false,
  delay = 0
}: {
  creator: any,
  rank: number,
  metric: string,
  metricLabel: string,
  formatVal: any,
  icon: React.ReactNode,
  color: string,
  isGold?: boolean,
  delay?: number
}) {
  if (!creator) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: 'spring' }}
      className={cn(
        "relative flex flex-col items-center",
        isGold ? "z-10" : "z-0"
      )}
    >
      <div className={cn(
        "absolute -top-12 flex flex-col items-center gap-2",
        isGold ? "scale-125" : "scale-100"
      )}>
        {icon}
      </div>

      <Card className={cn(
        "w-full border-2 rounded-[2.5rem] shadow-2xl transition-all duration-500 overflow-hidden bg-white group hover:-translate-y-2",
        color,
        isGold ? "scale-110" : "scale-100"
      )}>
        <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <Avatar className={cn(
              "border-4 border-white shadow-xl ring-4 ring-primary/5",
              isGold ? "h-32 w-32" : "h-24 w-24"
            )}>
              <AvatarImage src={creator.image} />
              <AvatarFallback>{creator.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg">
              #{rank}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-primary transition-colors">
              {creator.name}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">@{creator.handle}</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase px-2 h-5">
              {creator.niche}
            </Badge>
          </div>

          <div className="w-full pt-6 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{metricLabel}</p>
            <p className={cn(
              "text-3xl font-black tracking-tighter",
              isGold ? "text-primary" : "text-slate-900"
            )}>
              {formatVal(creator[metric], metric)}
            </p>
          </div>

          <Link href={`/creator/${creator.handle}`} className="w-full">
            <Button variant="outline" className="w-full rounded-xl font-bold border-slate-100 text-xs hover:bg-primary hover:text-white hover:border-primary transition-all">
              View Analytics <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
