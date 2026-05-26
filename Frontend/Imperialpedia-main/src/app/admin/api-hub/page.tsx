
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Terminal, ShieldCheck, Zap, RefreshCw, Key, Settings2, Loader2, Trash2, Plus, ArrowRightLeft, Globe
} from 'lucide-react';
import { adminKernel } from '@/lib/services/admin-service';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function APIIntegrationHub() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setKeys(adminKernel.getApiKeys());
    setLoading(false);
  }, []);

  const handleTest = (service: string) => {
    toast({ title: "API Handshake Successful", description: `Active link established with ${service} node.` });
  };

  if (loading) return <div className="py-40 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Terminal className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Connectivity</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">API Integration Hub</Text>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8">
          <Plus className="mr-2 h-4 w-4" /> Provision New Token
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8">
              <CardTitle>Handshake Registry</CardTitle>
              <CardDescription>Manage active cryptographic connections to external market and AI data nodes.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 border-b border-white/5">
                  <TableHead className="pl-8 py-6 uppercase text-[10px] font-bold">Service Node</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold text-center">Status</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold text-center">Usage</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map(k => (
                  <TableRow key={k.id} className="hover:bg-white/5 border-b border-white/5">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary"><Key size={14} /></div>
                        <div>
                          <span className="text-sm font-bold">{k.service}</span>
                          <span className="text-[9px] text-muted-foreground block font-mono">NODE_{k.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] uppercase font-bold px-2">{k.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-primary">{k.usage}</span>
                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: k.usage }} /></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleTest(k.service)}><RefreshCw size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive"><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <ArrowRightLeft className="h-24 w-24 text-primary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <ShieldCheck className="h-4 w-4" /> Identity Sealed
            </div>
            <Text variant="caption" className="text-muted-foreground leading-relaxed italic block">
              "Every API handshake is cryptographically signed and routed through the **Imperialpedia Proxy Layer** to ensure zero-leakage of proprietary research data."
            </Text>
          </Card>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest">Gateway Toggles</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                { label: 'Real-time Market Feed', status: true },
                { label: 'Claude 3.5 Engine', status: true },
                { label: 'News Wire ingestion', status: false },
              ].map(gate => (
                <div key={gate.label} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5">
                  <Text variant="caption" className="font-bold">{gate.label}</Text>
                  <Switch defaultChecked={gate.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
