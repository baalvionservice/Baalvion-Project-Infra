
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  ChevronRight, 
  Activity, 
  DollarSign,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { adminKernel } from '@/lib/services/admin-service';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    articles: 0,
    users: 0,
    revenue: '$168,400',
    pending: 5
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const articles = adminKernel.getArticles();
    const users = adminKernel.getUsers();
    setStats({
      articles: articles.length,
      users: users.length,
      revenue: '$168,400',
      pending: articles.filter(a => a.status === 'review').length || 3
    });
    setLoading(false);
  }, []);

  if (loading) return <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Platform Oversight</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Governance Mission Control</Text>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 h-10 px-4 gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Kernel Synchronized
          </Badge>
          <Button variant="outline" className="rounded-xl h-10 px-6 border-white/10" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Re-index
          </Button>
        </div>
      </header>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Identity Nodes', value: stats.users.toLocaleString(), icon: Users, color: 'text-primary', trend: '+12%' },
          { label: 'Intelligence Nodes', value: stats.articles.toLocaleString(), icon: FileText, color: 'text-secondary', trend: '+8' },
          { label: 'Fiscal Yield', value: stats.revenue, icon: DollarSign, color: 'text-emerald-500', trend: '+18.2%' },
          { label: 'Triage Queue', value: stats.pending, icon: ShieldAlert, color: 'text-amber-500', trend: 'High' },
        ].map((kpi) => (
          <Card key={kpi.label} className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl bg-background/50 border border-white/5 transition-transform group-hover:scale-110", kpi.color)}>
                  <kpi.icon size={20} />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold border-white/10 uppercase bg-black/20">{kpi.trend}</Badge>
              </div>
              <div className="text-3xl font-bold tracking-tighter">{kpi.value}</div>
              <Text variant="label" className="text-[10px] opacity-50 uppercase font-bold tracking-widest mt-1">{kpi.label}</Text>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Pipeline Activity */}
        <Card className="lg:col-span-8 glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Intelligence Pipeline</CardTitle>
              <CardDescription>Real-time audit of recent content commitments.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
              <Link href="/admin/content">Full Matrix <ChevronRight size={14} /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {adminKernel.getArticles().slice(0, 5).map(article => (
                <div key={article.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-background/50 border border-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <FileText size={18} />
                    </div>
                    <div>
                      <Text variant="bodySmall" weight="bold" className="block text-foreground/90 group-hover:text-primary transition-colors">{article.title}</Text>
                      <Text variant="caption" className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest">{article.category} • {article.status}</Text>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] opacity-50">{article.updatedAt}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Growth Logic Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="h-24 w-24 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <Zap className="h-4 w-4" /> AI Growth Engine
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block mb-6">
              "The current reach is peaking in the **Fixed Income** hub. AI recommends creating 5 new glossary nodes for 'Yield Spread' to capture rising search intent."
            </Text>
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 font-bold" asChild>
              <Link href="/admin/ai">Enter AI Lab</Link>
            </Button>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">System Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-muted-foreground">Index Health</span>
                  <span className="text-emerald-500">99.9%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[99.9%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-muted-foreground">pSEO Coverage</span>
                  <span className="text-primary">1.2M Nodes</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[85%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
