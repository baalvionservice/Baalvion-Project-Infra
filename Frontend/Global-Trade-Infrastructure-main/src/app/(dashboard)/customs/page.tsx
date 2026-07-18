/**
 * @file customs/page.tsx
 * @description THE NATIONAL CUSTOMS COMMAND HUB.
 * High-authority workbench for managing jurisdictional clearances, tariff audits, and regulatory holds.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import {
  ShieldCheck,
  Scale,
  FileCheck,
  Users,
  AlertTriangle,
  Search,
  ArrowRight,
  Loader2,
  Clock,
  ExternalLink,
  ShieldAlert,
  Gavel,
  History,
  Activity,
  Zap,
  Globe,
  Filter,
  MoreVertical
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { PATHS } from '@/lib/paths';

const STATUS_OPTIONS = ['all', 'cleared', 'hold', 'pending', 'review'];

export default function CustomsCommandHub() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [enforcingOpen, setEnforcingOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
       const res = await apiClient.get<any[]>('/customs_entries');
       setEntries(res.data || []);
       setLoading(false);
    };
    fetchData();
  }, []);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesStatus = statusFilter === 'all' || String(entry.status || '').toLowerCase() === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      const haystack = `${entry.id} ${entry.shipmentId} ${entry.originCountry} ${entry.destinationCountry} ${entry.hts_code || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [entries, statusFilter, search]);

  const onHold = entries.filter((e) => e.status === 'hold').length;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Jurisdictional Gatekeeper</p>
          <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter text-foreground leading-none">Customs Command.</h2>
          <p className="text-muted-foreground font-medium italic">Authoritative oversight of national trade rules, tariff audits, and regulatory finality.</p>
        </div>
        <div className="flex gap-4">
           <RevisionHistoryDialog entries={entries} />
           <button
              type="button"
              onClick={() => setEnforcingOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 rounded-2xl border-2 border-indigo-100 text-xs font-black uppercase tracking-widest text-indigo-700 shadow-sm animate-in zoom-in duration-500 hover:bg-indigo-100 transition-colors cursor-pointer"
           >
              <Scale className="h-4 w-4" />
              State: ENFORCING
           </button>
        </div>
      </div>

      <Dialog open={enforcingOpen} onOpenChange={setEnforcingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Enforcement State: ENFORCING</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground italic">
              This jurisdiction is actively applying regulatory holds and duty assessments to every declaration on submission — no waiver mode is active.
            </p>
            <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Active Declarations</span><span className="font-black">{entries.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">On Regulatory Hold</span><span className="font-black text-red-600">{onHold}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase text-[10px]">Cleared</span><span className="font-black text-emerald-600">{entries.filter((e) => e.status === 'cleared').length}</span></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEnforcingOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Active Declarations', val: entries.length, icon: FileCheck, color: 'text-blue-600' },
          { label: 'Clearance Speed', val: '4.2h', icon: Zap, color: 'text-emerald-600' },
          { label: 'Regulatory Flags', val: entries.filter(e => e.status === 'hold').length, icon: AlertTriangle, color: 'text-orange-600' },
          { label: 'Revenue Yield', val: '$124k', icon: Gavel, color: 'text-indigo-600' },
        ].map((stat, i) => (
          <Card key={stat.label} className="shadow-lg border-2 border-primary/5 bg-background rounded-3xl group hover:border-primary/20 transition-all">
             <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-8 pt-8">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-wide">{stat.label}</CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
             </CardHeader>
             <CardContent className="px-8 pb-8">
                <div className="text-3xl font-black tracking-tighter tabular-nums">{stat.val}</div>
             </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
         <CardHeader className="bg-muted/10 border-b py-8 px-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
               <CardTitle className="text-xl font-black uppercase tracking-tighter">Operational Clearance Ledger</CardTitle>
               <CardDescription className="text-xs font-medium">Authoritative record of jurisdictional audits and state transitions.</CardDescription>
            </div>
            <div className="flex gap-4">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="h-11 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest">
                        <Filter className="mr-2 h-4 w-4" /> {statusFilter === 'all' ? 'ALL STATUSES' : statusFilter.toUpperCase()}
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     {STATUS_OPTIONS.map((s) => (
                        <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="uppercase text-xs font-bold">
                           {s === 'all' ? 'All Statuses' : s}
                        </DropdownMenuItem>
                     ))}
                  </DropdownMenuContent>
               </DropdownMenu>
               <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="DISCOVER NODES..."
                     className="h-11 w-56 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest pl-10"
                  />
               </div>
            </div>
         </CardHeader>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/30 border-b-2">
                     <tr>
                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entry Identity</th>
                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Corridor</th>
                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Classification</th>
                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Duties (EST)</th>
                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">State</th>
                        <th className="p-8 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Finalize</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y-2">
                     {filteredEntries.length === 0 ? (
                        <tr><td colSpan={6} className="p-16 text-center opacity-30 italic text-sm">No customs entries match this filter.</td></tr>
                     ) : filteredEntries.map((entry) => (
                        <tr key={entry.id} className="group hover:bg-primary/[0.01] transition-colors border-b last:border-0 cursor-pointer" onClick={() => router.push(`/customs/${entry.shipmentId}`)}>
                           <td className="p-8">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-muted border-2 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform"><FileCheck className="h-5 w-5 text-primary opacity-60" /></div>
                                 <div className="space-y-0.5">
                                    <p className="font-black text-sm uppercase tracking-tight">{entry.id}</p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Shipment: {entry.shipmentId}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-8">
                              <div className="flex items-center gap-2">
                                 <span className="text-xs font-black uppercase tracking-tight">{entry.originCountry}</span>
                                 <ArrowRight className="h-2 w-2 text-muted-foreground opacity-30" />
                                 <span className="text-xs font-black uppercase tracking-tight">{entry.destinationCountry}</span>
                              </div>
                           </td>
                           <td className="p-8">
                              <span className="font-mono text-xs font-bold text-muted-foreground">{entry.hts_code || 'UNCLASSIFIED'}</span>
                           </td>
                           <td className="p-8">
                              <span className="font-black text-sm tabular-nums">{formatCurrency(entry.importDuty + entry.tax, entry.currency)}</span>
                           </td>
                           <td className="p-8">
                              <Badge variant="outline" className={cn(
                                 "text-[9px] font-black uppercase h-7 px-3 border-2 rounded-full",
                                 entry.status === 'cleared' ? 'bg-green-50 text-green-700 border-green-200' : 
                                 entry.status === 'hold' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-muted'
                              )}>{entry.status}</Badge>
                           </td>
                           <td className="p-8 text-right">
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-20 group-hover:opacity-100 transition-opacity">
                                 <MoreVertical className="h-5 w-5" />
                              </Button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </CardContent>
      </Card>
    </main>
  );
}

interface RevisionEvent {
  entryId: string;
  label: string;
  at: string;
}

function RevisionHistoryDialog({ entries }: { entries: any[] }) {
  const events: RevisionEvent[] = entries.flatMap((e) => {
    const out: RevisionEvent[] = [];
    if (e.createdAt) out.push({ entryId: e.id, label: 'Declaration Filed', at: e.createdAt });
    if (e.submittedAt) out.push({ entryId: e.id, label: 'Submitted for Clearance', at: e.submittedAt });
    if (e.clearedAt) out.push({ entryId: e.id, label: 'Cleared', at: e.clearedAt });
    if (e.status === 'hold' && e.updatedAt) out.push({ entryId: e.id, label: 'Regulatory Hold Applied', at: e.updatedAt });
    return out;
  }).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-black border-2 bg-background h-14 px-8 text-[10px] uppercase tracking-widest shadow-md">
           <History className="mr-2 h-4 w-4" /> REVISION HISTORY
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Customs Revision History</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm italic opacity-50 text-center py-8">No declaration state changes recorded yet.</p>
          ) : (
            events.map((ev, i) => (
              <div key={`${ev.entryId}-${ev.label}-${i}`} className="p-3 rounded-lg border flex items-center justify-between text-xs gap-4">
                <div className="min-w-0">
                  <p className="font-black uppercase truncate">{ev.label}</p>
                  <p className="text-muted-foreground truncate">Entry: {ev.entryId}</p>
                </div>
                <span className="text-muted-foreground shrink-0">{new Date(ev.at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
