'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Scale, 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText,
  Lock, 
  ArrowRight, 
  Zap, 
  Info, 
  ChevronRight,
  Globe,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ComplianceLegalHub() {
  const [search, setSearch] = useState('');
  
  const mockComplianceLogs = [
    { id: 'c1', entity: "Article: Bitcoin Prediction", action: "Risk Disclaimer Added", auditor: "LegalBot", status: "Nominal", date: "2026-03-15 10:00" },
    { id: 'c2', entity: "User #842", action: "Terms Violation: Manipulation", auditor: "Eleanor Vance", status: "Critical", date: "2026-03-15 11:30" },
    { id: 'c3', entity: "Global Engine", action: "GDPR Consent Audit", auditor: "Compliance Node", status: "Nominal", date: "2026-03-14 16:45" },
    { id: 'c4', entity: "Ad Hub", action: "Regulatory Review", auditor: "LegalBot", status: "Warning", date: "2026-03-14 09:15" },
  ];

  const handleAction = (label: string) => {
    toast({ title: "Handshake Initiated", description: `Reviewing compliance node: ${label}` });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Scale className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Regulatory Oversight</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Compliance & Legal</Text>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[9px] h-11 px-4">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Index Compliant
          </Badge>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8">
            Launch Legal Review
          </Button>
        </div>
      </header>

      {/* COMPLIANCE VITALS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unresolved Flags', value: '12', icon: ShieldAlert, color: 'text-destructive' },
          { label: 'Audit Velocity', value: '180ms', icon: Zap, color: 'text-primary' },
          { label: 'Regulatory Coverage', value: '100%', icon: Globe, color: 'text-secondary' },
          { label: 'Last Scan', value: '4m ago', icon: Clock, color: 'text-muted-foreground' }
        ].map((v) => (
          <Card key={v.label} className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <v.icon className={cn("h-5 w-5 mb-1", v.color)} />
              <div className="text-2xl font-bold tracking-tighter">{v.value}</div>
              <Text variant="label" className="text-[8px] opacity-50 uppercase font-bold tracking-widest leading-none">{v.label}</Text>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* COMPLIANCE LOGS MATRIX */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-3">
              <History className="h-5 w-5 text-primary" /> Immutable Audit Trail
            </CardTitle>
            <CardDescription>Chronological record of every legal and compliance handshake committed.</CardDescription>
          </div>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search audit trail..." 
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
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Target Entity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Administrative Action</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Auditor Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockComplianceLogs.filter(l => l.entity.toLowerCase().includes(search.toLowerCase())).map((log) => (
                <TableRow key={log.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">{log.entity}</span>
                  </TableCell>
                  <TableCell>
                    <Text variant="caption" className="text-muted-foreground font-bold">{log.action}</Text>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-muted-foreground opacity-40" />
                      <span className="text-xs font-medium">{log.auditor}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge className={cn(
                        "text-[8px] font-bold uppercase border-none px-2 h-5",
                        log.status === 'Nominal' ? "bg-emerald-500/10 text-emerald-500" :
                        log.status === 'Critical' ? "bg-destructive/10 text-destructive animate-pulse" :
                        "bg-amber-500/10 text-amber-500"
                      )}>{log.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{log.date}</span>
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
            <Zap className="h-32 w-32 text-primary rotate-12" />
          </div>
          <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-4">
            <ShieldCheck className="h-4 w-4" /> Institutional Safeguard
          </div>
          <Text variant="body" className="text-foreground/90 leading-relaxed font-medium italic border-l-2 border-primary/20 pl-6 py-2">
            "The **AI Compliance Guard** has been updated to automatically inject risk disclaimers into any research node mentioning derivatives or high-volatility cryptocurrencies."
          </Text>
          <Button variant="link" className="mt-6 p-0 h-auto text-primary font-bold text-xs uppercase group/link" onClick={() => handleAction('Disclaimer Settings')}>
            Review Disclaimer Logic <ChevronRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
          </Button>
        </Card>

        <div className="p-10 rounded-[3rem] bg-secondary/5 border border-secondary/20 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
              <Info className="h-6 w-6" />
            </div>
            <Text variant="h3" className="font-bold">Legal Review Queue</Text>
          </div>
          <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
            There are **3 pending submissions** that triggered automatic compliance flags. These nodes require manual auditor sign-off before being committed to the search index.
          </Text>
          <Button variant="outline" className="w-full h-12 rounded-xl border-secondary/20 text-secondary font-bold text-xs uppercase" onClick={() => handleAction('Full Review Queue')}>
            Enter Legal review Gate
          </Button>
        </div>
      </div>
    </div>
  );
}
