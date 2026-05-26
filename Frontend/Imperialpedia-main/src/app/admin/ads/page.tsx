'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Megaphone, Plus, Search, Edit, Trash2, TrendingUp, 
  ChevronRight, ArrowUpRight, Zap, Target, Users, DollarSign,
  Activity, PieChart as PieIcon, Link as LinkIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdsPartnershipsHub() {
  const [search, setSearch] = useState('');
  
  const mockAds = [
    { id: 'ad1', client: "Goldman Sachs", placement: "Header Leaderboard", ctr: "1.2%", revenue: "$12,400", status: "Active" },
    { id: 'ad2', client: "eToro", placement: "In-Article Sponsor", ctr: "3.5%", revenue: "$22,100", status: "Active" },
    { id: 'ad3', client: "Mastercard", placement: "Sidebar Tools", ctr: "0.8%", revenue: "$4,200", status: "Paused" },
    { id: 'ad4', client: "Crypto.com", placement: "Footer Sticky", ctr: "2.1%", revenue: "$8,500", status: "Active" },
  ];

  const handleAction = (label: string) => {
    toast({ title: "Campaign Updated", description: `Synchronization successful for partner node: ${label}` });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Megaphone className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Revenue Orchestration</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Ads & Partnerships</Text>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Create New Campaign
        </Button>
      </header>

      {/* AD VITALS MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ad Revenue', value: '$47,200', icon: DollarSign, color: 'text-emerald-500', trend: '+15%' },
          { label: 'Avg. CTR', value: '1.9%', icon: TrendingUp, color: 'text-primary', trend: '+0.4%' },
          { label: 'Active Partners', value: '42', icon: Users, color: 'text-secondary', trend: '+2' },
          { label: 'Network Yield', value: '92%', icon: Zap, color: 'text-amber-500', trend: 'Stable' }
        ].map((v) => (
          <Card key={v.label} className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-xl bg-background/50 border border-white/5", v.color)}>
                  <v.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-white/10 bg-black/20">{v.trend}</Badge>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tighter">{v.value}</div>
                <Text variant="label" className="text-[10px] opacity-50 uppercase font-bold tracking-widest mt-1">{v.label}</Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-3">
              <PieIcon className="h-5 w-5 text-primary" /> Campaign Inventory
            </CardTitle>
            <CardDescription>Auditing active placements and partner revenue velocity.</CardDescription>
          </div>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search campaigns..." 
              className="pl-10 h-11 bg-background/50 border-white/10 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Partner Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Placement Hub</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">CTR</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Revenue</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAds.filter(ad => ad.client.toLowerCase().includes(search.toLowerCase())).map((ad) => (
                <TableRow key={ad.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">{ad.client}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-bold uppercase border-white/10 bg-black/20 px-2 h-5">
                      {ad.placement}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-emerald-500">{ad.ctr}</TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-primary">{ad.revenue}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge className={cn(
                        "text-[8px] font-bold uppercase border-none px-2 h-5",
                        ad.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                      )}>{ad.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => handleAction(ad.client)}><Activity className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Target className="h-32 w-32 text-primary rotate-12" />
          </div>
          <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-4">
            <Zap className="h-4 w-4" /> Yield Optimizer
          </div>
          <Text variant="body" className="text-foreground/90 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-6 py-2">
            "Placements within the **'Cryptocurrency'** hub are achieving a 45% higher RPM this cycle. Suggest shifting 12% of unsold inventory to the premium 'Deep-Dive' sidebar nodes."
          </Text>
        </Card>

        <div className="p-10 rounded-[3rem] bg-secondary/5 border border-secondary/20 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
              <LinkIcon className="h-6 w-6" />
            </div>
            <Text variant="h3" className="font-bold">Affiliate Campaign Logic</Text>
          </div>
          <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
            Automated affiliate link tracking is active. The engine is currently monitoring **142 active nodes** for yield performance and broken handshakes.
          </Text>
          <Button variant="outline" className="w-full h-12 rounded-xl border-secondary/20 text-secondary font-bold text-xs uppercase" onClick={() => handleAction('Affiliate Matrix')}>
            Enter Affiliate Matrix
          </Button>
        </div>
      </div>
    </div>
  );
}