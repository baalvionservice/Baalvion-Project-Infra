'use client';

import React, { useState } from 'react';
import { UserDashboardData, WatchlistItem } from '@/types/user-system';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Text } from '@/design-system/typography/text';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Star, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Bell, 
  Settings, 
  ChevronRight, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  Activity,
  Bookmark,
  Calculator as CalcIcon,
  Search,
  LogOut,
  Moon,
  FlaskConical,
  Flame,
  Layout
} from 'lucide-react';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DashboardClientProps {
  data: UserDashboardData;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const [preferences, setPreferences] = useState(data.preferences);
  const [watchlist, setWatchlist] = useState(data.watchlists_overview);

  const COLORS = ['#8272F2', '#69B9FF', '#10b981', '#f59e0b'];

  const handleTogglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 rounded-2xl border-2 border-primary/20 shadow-xl">
            <AvatarImage src={data.user_details.avatar} />
            <AvatarFallback>{data.user_details.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Text variant="h1" className="text-3xl font-bold tracking-tight">Welcome, {data.user_details.name.split(' ')[0]}</Text>
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase h-5">
                {data.user_details.subscription_tier} Tier
              </Badge>
            </div>
            <Text variant="bodySmall" className="text-muted-foreground">
              Market Oversight Node: <span className="text-foreground font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-6 border-white/10 bg-card/30" asChild>
            <Link href="/financial-tools"><CalcIcon className="mr-2 h-4 w-4" /> Tools</Link>
          </Button>
          <Button className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
            <Search className="mr-2 h-4 w-4" /> Discover Intelligence
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Portfolio & Watchlist */}
        <div className="lg:col-span-8 space-y-8">
          {/* Portfolio Pulse */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden group">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <PieIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Portfolio Summary</CardTitle>
                  <CardDescription>Aggregate valuation across indexed nodes.</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold tracking-tighter">{data.portfolio_summary.total_value}</div>
                <div className="flex items-center justify-end text-[10px] text-emerald-500 font-bold mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> {data.portfolio_summary.gain_loss_percent}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/5">
                <div className="md:col-span-7 p-8">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.portfolio_summary.history}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8272F2" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          hide 
                        />
                        <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#8272F2' }}
                          labelStyle={{ opacity: 0.5, fontSize: '10px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#8272F2" 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="md:col-span-5 p-8 flex flex-col justify-center">
                  <div className="space-y-6">
                    {data.portfolio_summary.allocation.map((item, idx) => (
                      <div key={item.asset} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            {item.asset}
                          </span>
                          <span className="font-bold">{item.percentage}%</span>
                        </div>
                        <Progress value={item.percentage} className="h-1 bg-white/5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Watchlist Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                Active Watchlist
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-bold text-xs" asChild>
                <Link href="/search">Edit Matrix <ChevronRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {watchlist.map((item) => (
                <Card key={item.id} className="glass-card hover:border-primary/30 transition-all cursor-pointer group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center text-xs font-bold border border-white/5 group-hover:border-primary/20 transition-colors">
                        {item.symbol}
                      </div>
                      <div>
                        <Text variant="bodySmall" weight="bold">{item.asset}</Text>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-bold h-4 px-1.5 border-none bg-background/50 mt-1",
                          item.sentiment === 'Bullish' ? 'text-emerald-500' :
                          item.sentiment === 'Bearish' ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          {item.sentiment}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono">{item.currentValue}</div>
                      <div className={cn(
                        "text-[10px] font-bold flex items-center justify-end mt-0.5",
                        item.isPositive ? 'text-emerald-500' : 'text-destructive'
                      )}>
                        {item.isPositive ? <TrendingUp className="h-2.5 w-2.5 mr-1" /> : <TrendingDown className="h-2.5 w-2.5 mr-1" />}
                        {item.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Feed & Saved */}
        <div className="lg:col-span-4 space-y-8">
          {/* Recent Notifications */}
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Intelligence Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {data.notifications.map((notif) => (
                  <div key={notif.id} className={cn(
                    "p-4 flex gap-4 hover:bg-white/5 transition-colors group",
                    !notif.read_status && "bg-primary/5"
                  )}>
                    <div className={cn(
                      "mt-1 w-2 h-2 rounded-full shrink-0",
                      !notif.read_status ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                    )} />
                    <div className="space-y-1">
                      <Text variant="caption" className={cn(
                        "leading-relaxed",
                        !notif.read_status ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {notif.message}
                      </Text>
                      <Text variant="caption" className="text-[9px] text-muted-foreground/50 font-mono">
                        {format(new Date(notif.date), 'MMM d, HH:mm')}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none">
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Saved Intelligence */}
          <div className="space-y-4">
            <Card className="glass-card border-none bg-primary/5 group hover:border-primary/20 transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Bookmark className="h-5 w-5" />
                  </div>
                  <div>
                    <Text variant="bodySmall" weight="bold">Saved Analysis</Text>
                    <Text variant="caption" className="text-muted-foreground">{data.saved_articles.length} Intelligence Nodes</Text>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl group-hover:text-primary" asChild>
                  <Link href="/articles"><ChevronRight className="h-5 w-5" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-none bg-secondary/5 group hover:border-secondary/20 transition-all">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                    <CalcIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <Text variant="bodySmall" weight="bold">Saved Engines</Text>
                    <Text variant="caption" className="text-muted-foreground">{data.saved_calculators.length} Strategic Tools</Text>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl group-hover:text-secondary" asChild>
                  <Link href="/financial-tools"><ChevronRight className="h-5 w-5" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preferences & Settings */}
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" /> Studio Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <Text variant="caption" weight="bold">Dark Interface</Text>
                    <Text variant="caption" className="text-muted-foreground block text-[9px]">OLED Optimization</Text>
                  </div>
                </div>
                <Switch 
                  checked={preferences.dark_mode} 
                  onCheckedChange={() => handleTogglePreference('dark_mode')} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-amber-500">
                    <FlaskConical className="h-4 w-4" />
                  </div>
                  <div>
                    <Text variant="caption" weight="bold">Beta Feature Opt-in</Text>
                    <Text variant="caption" className="text-muted-foreground block text-[9px]">Early Access: Veo Video Engine</Text>
                  </div>
                </div>
                <Switch 
                  checked={preferences.beta_opt_in} 
                  onCheckedChange={() => handleTogglePreference('beta_opt_in')} 
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <Button variant="ghost" className="w-full justify-between h-9 text-xs text-muted-foreground hover:text-destructive group">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" /> Sign out of node
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Insight */}
      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden text-center lg:text-left">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Activity className="h-64 w-64 text-primary" />
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Zap className="h-10 w-10" />
          </div>
          <div className="flex-1 space-y-2">
            <Text variant="h3" className="text-2xl font-bold">Pro Intelligence Enabled</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-3xl">
              As a **{data.user_details.subscription_tier}** member, you have unrestricted access to the Advanced AI Analyst suite. Run unlimited Bull/Bear cases, detect upcoming catalysts, and analyze longitudinal market trends across 1M+ nodes.
            </Text>
          </div>
          <Button size="lg" className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0" asChild>
            <Link href="/ai-analyst/daily-briefing">Launch AI Suite</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
