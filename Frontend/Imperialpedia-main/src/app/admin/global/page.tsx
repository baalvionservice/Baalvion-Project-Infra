'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Globe, Languages, Search, Filter, CheckCircle2, 
  XCircle, Clock, ArrowRight, Zap, Info, Layers,
  Activity, MapPin, RefreshCw, Plus, Trash2, Edit, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function GlobalPublishingHub() {
  const [search, setSearch] = useState('');
  
  const mockRegions = [
    { code: "US", name: "United States", language: "English", status: "Active", nodes: "1.2M", currency: "USD" },
    { code: "UK", name: "United Kingdom", language: "English", status: "Active", nodes: "450k", currency: "GBP" },
    { code: "FR", name: "France", language: "French", status: "Active", nodes: "280k", currency: "EUR" },
    { code: "IN", name: "India", language: "Hindi", status: "Maintenance", nodes: "150k", currency: "INR" },
  ];

  const handleSync = (region: string) => {
    toast({ title: "Regional Sync Initiated", description: `Broadcasting metadata updates to the ${region} discovery cluster.` });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Globe className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Multi-Region Engine</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Global Hub Orchestration</Text>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Provision Region Node
        </Button>
      </header>

      {/* REGIONAL PERFORMANCE SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Regions', value: '4', icon: MapPin, color: 'text-primary' },
          { label: 'Global Discovery', value: '2.1M', icon: Activity, color: 'text-secondary' },
          { label: 'Language Nodes', value: '12', icon: Languages, color: 'text-emerald-500' },
          { label: 'Edge Latency', value: '42ms', icon: Zap, color: 'text-amber-500' }
        ].map((v) => (
          <Card key={v.label} className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
            <CardContent className="p-6 flex items-center gap-5">
              <div className={cn("p-3 rounded-2xl bg-background/50 border border-white/5", v.color)}>
                <v.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">{v.value}</div>
                <Text variant="label" className="text-[9px] opacity-50 uppercase font-bold tracking-widest">{v.label}</Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-3">
              <Layers className="h-5 w-5 text-primary" /> Regional Matrix
            </CardTitle>
            <CardDescription>Managing localized discovery clusters and currency-pSEO synchronization.</CardDescription>
          </div>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search regional index..." 
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
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Region Hub</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Dialect Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Currency</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Index Scale</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRegions.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map((reg) => (
                <TableRow key={reg.code} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shadow-inner">{reg.code}</div>
                      <span className="text-sm font-bold text-foreground/90">{reg.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-bold uppercase border-white/10 bg-black/20 px-2 h-5">
                      {reg.language}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground">{reg.currency}</TableCell>
                  <TableCell className="text-center font-bold text-xs text-primary">{reg.nodes}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge className={cn(
                        "text-[8px] font-bold uppercase border-none px-2 h-5",
                        reg.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>{reg.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => handleSync(reg.name)}><RefreshCw className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary"><Edit className="h-3.5 w-3.5" /></Button>
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
            <Languages className="h-32 w-32 text-primary rotate-12" />
          </div>
          <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-4">
            <Zap className="h-4 w-4" /> Translation Engine
          </div>
          <Text variant="body" className="text-foreground/90 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-6 py-2">
            "Automated dialect mapping is currently translating the **'Monetary Policy'** taxonomy into Spanish and Hindi. Expected propagation to edge nodes: 42 minutes."
          </Text>
        </Card>

        <div className="p-10 rounded-[3rem] bg-card/30 border border-white/5 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-muted text-muted-foreground">
              <Info className="h-6 w-6" />
            </div>
            <Text variant="h3" className="font-bold">Handshake Protocol</Text>
          </div>
          <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
            Multi-region publishing requires a vertical legal review for any content specific to regulated jurisdictions (e.g., SEBI in India, SEC in USA).
          </Text>
          <Button variant="link" className="p-0 h-auto text-primary font-bold text-[10px] uppercase w-fit group" asChild>
            <Link href="/admin/compliance">
              Access Compliance Matrix <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
