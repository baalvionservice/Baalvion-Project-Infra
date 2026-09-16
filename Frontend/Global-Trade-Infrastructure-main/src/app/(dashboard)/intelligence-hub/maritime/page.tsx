/**
 * @file maritime/page.tsx
 * @description Operational Maritime Intelligence terminal.
 */
'use client';

import { useEffect, useState } from 'react';
import { maritimeService, TrackingSummary } from '@/modules/intelligence/services/maritime.service';
import { MaritimeEvent } from '@/modules/intelligence/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Ship, 
  Anchor, 
  Waves, 
  Activity, 
  Loader2, 
  ArrowRight, 
  History, 
  MapPin,
  Compass,
  Zap,
  Search,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { PATHS } from '@/lib/paths';

export default function MaritimeIntelligencePage() {
  const [events, setEvents] = useState<MaritimeEvent[]>([]);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = () => {
    Promise.allSettled([maritimeService.getRecentEvents(), maritimeService.getSummary()])
      .then(([ev, sm]) => {
        if (ev.status === 'fulfilled') setEvents(ev.value);
        if (sm.status === 'fulfilled') setSummary(sm.value);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <main className="flex-1 space-y-8 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(PATHS.INTELLIGENCE_HUB)} className="-ml-4 text-[10px] font-black uppercase tracking-wide text-muted-foreground hover:bg-transparent hover:text-primary">
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Command Hub
          </Button>
          <div className="space-y-1">
             <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter text-foreground leading-none">Maritime SIGINT</h2>
             <p className="text-muted-foreground font-medium italic max-w-2xl">Autonomous vessel tracking, port load telemetry, and shipping lane finality.</p>
          </div>
        </div>
        <div className="flex gap-4">
           <Button onClick={fetchData} className="font-black shadow-2xl h-14 px-6 text-[10px] uppercase tracking-widest bg-primary">
              <Zap className="mr-2 h-4 w-4" /> REFRESH
           </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LIVE VESSEL STREAM */}
        <div className="lg:col-span-8 space-y-8">
           {events.length === 0 && (
              <Card className="shadow-none border-2 border-dashed rounded-2xl bg-background">
                 <CardContent className="p-12 text-center">
                    <Ship className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">No active shipment alerts</p>
                    <p className="text-xs text-muted-foreground mt-1">Geofence, IoT, and delay/ETA events from tracked sea shipments will appear here.</p>
                 </CardContent>
              </Card>
           )}
           {events.map((ev, i) => (
              <Card key={ev.id} className="shadow-xl border-2 hover:border-primary/40 transition-all rounded-2xl overflow-hidden bg-background group">
                 <CardContent className="p-8 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 flex-1 min-w-0">
                       <div className={cn(
                          "h-12 w-16 rounded-2xl border-2 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform",
                          (ev.severity === 'high' || ev.severity === 'critical') ? "bg-red-50 border-red-200" : "bg-muted border-primary/5"
                       )}>
                          <Ship className={cn("h-8 w-8", (ev.severity === 'high' || ev.severity === 'critical') ? 'text-red-600' : 'text-primary opacity-60')} />
                       </div>
                       <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-4">
                             <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground truncate">{ev.vesselName}</h3>
                             <Badge variant="outline" className="text-[8px] font-black h-5 uppercase px-2 border-2 rounded-full">{ev.vesselId.slice(0, 8)}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                             {ev.location && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {ev.location}</span>}
                             {ev.mode && <span className="flex items-center gap-1.5"><Anchor className="h-3 w-3" /> {ev.mode}</span>}
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 shrink-0">
                       <Badge className={cn(
                          "uppercase text-[9px] font-black h-6 px-3 border-none shadow-sm",
                          ev.severity === 'critical' || ev.severity === 'high' ? "bg-red-600 text-white" :
                          ev.severity === 'medium' ? "bg-orange-500 text-white" : "bg-primary text-white"
                       )}>{ev.type.replace(/_/g, ' ')}</Badge>
                       <span className="text-[10px] font-mono font-bold text-muted-foreground opacity-40">{new Date(ev.timestamp).toLocaleTimeString()} UTC</span>
                    </div>
                 </CardContent>
              </Card>
           ))}
        </div>

        {/* MARITIME SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="shadow-none border-2 bg-background p-6 space-y-6 rounded-2xl">
              <div className="flex items-center justify-between">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Fleet Health</h4>
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-8">
                 {[
                   { label: 'Shipment Health', val: summary?.shipmentHealthPct != null ? `${summary.shipmentHealthPct}%` : '—', icon: ShieldCheck },
                   { label: 'ETA Accuracy', val: summary?.etaAccuracyPct != null ? `${summary.etaAccuracyPct}%` : '—', icon: Activity },
                   { label: 'Avg Transit', val: summary?.avgTransitDays != null ? `${summary.avgTransitDays}d` : '—', icon: Ship },
                   { label: 'In Transit', val: summary?.inTransit ?? '—', icon: Waves },
                 ].map(stat => (
                   <div key={stat.label} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-2xl bg-muted border-2 shadow-inner group-hover:bg-primary/5 transition-colors"><stat.icon className="h-5 w-5 text-primary" /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                      </div>
                      <span className="text-xl font-black tracking-tighter tabular-nums">{stat.val}</span>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="shadow-none border-2 bg-background p-6 text-center space-y-6 rounded-2xl border-dashed group hover:border-primary/20 transition-all duration-700">
              <Waves className="h-14 w-14 mx-auto text-muted-foreground opacity-20 group-hover:text-primary transition-all duration-700" />
              <div className="space-y-2">
                 <p className="text-sm font-black uppercase tracking-widest text-foreground">Tracking Ingestion</p>
                 <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed px-4">
                    GPS/carrier webhook events and geofence/IoT alerts are ingested via trade-service's
                    Shipment Tracking &amp; Global Visibility Platform ({summary?.totalShipments ?? 0} shipment{summary?.totalShipments === 1 ? '' : 's'} tracked).
                 </p>
              </div>
           </Card>
        </div>
      </div>
    </main>
  );
}
