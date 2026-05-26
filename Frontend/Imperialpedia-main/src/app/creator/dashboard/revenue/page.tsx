'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/design-system/typography/text';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  Download, 
  Loader2, 
  Wallet, 
  History,
  CreditCard,
  ChevronRight,
  FileText
} from 'lucide-react';
import { getCreatorRevenue, getPayoutHistory } from '@/services/mock-api/creators';
import { CreatorRevenue, CreatorRevenueSummary } from '@/types';
import { format } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function CreatorRevenuePage() {
  const [summary, setSummary] = useState<CreatorRevenueSummary | null>(null);
  const [history, setHistory] = useState<CreatorRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryRes, historyRes] = await Promise.all([
          getCreatorRevenue('u-1'),
          getPayoutHistory('u-1')
        ]);
        setSummary(summaryRes.data);
        setHistory(historyRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !summary) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="text-muted-foreground animate-pulse">Synchronizing financial intelligence...</Text>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <DollarSign className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Monetization Engine</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Earnings & Payouts</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Track your intelligence revenue and manage your payout logistics.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button size="sm" className="shadow-lg shadow-primary/20 rounded-xl bg-primary hover:bg-primary/90">
            <Wallet className="mr-2 h-4 w-4" /> Withdraw Funds
          </Button>
        </div>
      </header>

      {/* Financial Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Accrued</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-2.5 w-2.5" /> +12.4% lifetime growth
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{formatCurrency(summary.availableBalance)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Next payout window: April 1</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Clearance</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingPayout)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Awaiting 7-day settlement</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <History className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Payout</CardTitle>
            <History className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{formatCurrency(4500.00)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Processed on {format(new Date(summary.lastPayoutDate), 'MMM d, yyyy')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Momentum visualization */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-lg">Revenue Momentum</CardTitle>
            <CardDescription>Daily earnings velocity across the Intelligence Index.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.revenueTrends}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
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
                  <YAxis 
                    stroke="#888888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1822', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#8272F2' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8272F2" 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* High-Velocity Insights Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card border-none shadow-xl bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> High-Velocity Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {summary.topEarningContent.map((item, idx) => (
                <div key={item.contentId} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <Text variant="bodySmall" className="font-bold line-clamp-1 group-hover:text-primary transition-colors">{item.title}</Text>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 border-primary/20 text-primary">Rank #{idx+1}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(item.revenue)}</div>
                    <Text variant="caption" className="text-[10px] text-emerald-500 font-bold uppercase">Trending</Text>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-white/5">
                <Text variant="caption" className="italic text-muted-foreground leading-relaxed">
                  "Your research on 'Yield Curve Dynamics' achieved 3x the average RPM this week due to high platform engagement."
                </Text>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] border border-secondary/20 bg-secondary/5 space-y-4">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <CreditCard className="h-4 w-4" /> Payout Logistics
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed">
              Standard payouts are processed on the **1st and 15th** of every month. Ensure your connected wallet address is verified.
            </Text>
            <Button variant="link" className="p-0 h-auto text-secondary text-xs font-bold">
              Review monetization policy <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Earnings History Matrix */}
      <Tabs defaultValue="history" className="w-full">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <TabsList className="bg-card/30 border border-white/5 p-1 h-11 rounded-xl">
            <TabsTrigger value="history" className="px-6 rounded-lg font-bold text-xs gap-2 data-[state=active]:bg-primary">
              <History className="h-3.5 w-3.5" /> Recent Earnings
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="px-6 rounded-lg font-bold text-xs gap-2 data-[state=active]:bg-primary">
              <Wallet className="h-3.5 w-3.5" /> Withdrawal History
            </TabsTrigger>
          </TabsList>
          
          <Button variant="ghost" size="sm" className="text-primary font-bold text-xs">
            View Full Statement <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <TabsContent value="history" className="mt-6">
          <Card className="glass-card border-none overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Intelligence Node</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date Earned</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row, idx) => (
                  <TableRow key={`${row.contentId}-${idx}`} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                    <TableCell className="pl-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold line-clamp-1">{row.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {format(new Date(row.dateEarned), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-bold uppercase tracking-tighter">
                        Cleared
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span className="font-mono font-bold text-sm">{formatCurrency(row.revenue)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-6">
          <div className="py-24 text-center bg-card/10 rounded-[3rem] border-2 border-dashed border-white/5">
            <Wallet className="h-12 w-12 text-muted-foreground opacity-20 mx-auto mb-4" />
            <Text variant="bodySmall" className="text-muted-foreground italic">No withdrawal history available for this quarter.</Text>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
