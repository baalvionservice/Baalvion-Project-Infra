'use client';

/**
 * @file maritime/page.tsx
 * @description THE GLOBAL MARITIME SIGINT OBSERVATORY.
 * High-authority command for planetary vessel tracking, lane finality, and port equilibrium.
 */

import { useEffect, useState } from 'react';
import { maritimeService, TrackingSummary } from '@/modules/intelligence/services/maritime.service';
import { seaRouteIntelligenceService, SeaRoute, RiskZone } from '@/services/sea-route-intelligence-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Ship, 
  Anchor, 
  Globe, 
  Activity, 
  Loader2, 
  ChevronLeft, 
  ArrowRight,
  Compass,
  Zap,
  Waves,
  ShieldCheck,
  Radio,
  Search,
  Lock,
  MapPin,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PATHS } from '@/lib/paths';

export default function MaritimeSigintObservatory() {
  const [routes, setRoutes] = useState<SeaRoute[]>([]);
  const [risks, setRisks] = useState<RiskZone[]>([]);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    const [rData, zData, sData] = await Promise.allSettled([
      seaRouteIntelligenceService.getSeaRoutes(),
      seaRouteIntelligenceService.getRiskZones(),
      maritimeService.getSummary(),
    ]);
    if (rData.status === 'fulfilled') setRoutes(rData.value);
    if (zData.status === 'fulfilled') setRisks(zData.value);
    if (sData.status === 'fulfilled') setSummary(sData.value);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && routes.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6 bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-[11px] font-black uppercase tracking-widest text-primary animate-pulse">Synchronizing AIS Satellite Link...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-4 md:p-6 bg-slate-950 text-slate-100 min-h-screen selection:bg-primary">
      {/* COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
             <p className="text-[10px] font-black uppercase tracking-widest text-primary">Authority Node: MARITIME_SIGINT_ALPHA</p>
          </div>
          <h2 className="text-4xl font-black tracking-tight uppercase tracking-tighter leading-[0.8]">Maritime <br />Command.</h2>
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-400 shadow-md">
              <Radio className="h-4 w-4 animate-pulse" />
              {summary?.activeAlerts ?? 0} Active Alert{summary?.activeAlerts === 1 ? '' : 's'}
           </div>
           <Button onClick={fetchData} className="h-12 px-6 bg-primary text-white font-black shadow-lg hover:scale-105 transition-all rounded-2xl uppercase tracking-wide text-xs">
              <Waves className="mr-3 h-5 w-5" /> Refresh
           </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* GLOBAL LANE MONITOR */}
        <div className="lg:col-span-8 space-y-6">
           <Card className="shadow-none border-none bg-slate-900/40 rounded-2xl overflow-hidden flex flex-col h-[700px] relative group">
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
              <CardHeader className="bg-white/5 border-b border-white/5 p-6 flex flex-row items-center justify-between z-10">
                 <div className="space-y-1">
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter text-white">Corridor Equilibrium Map</CardTitle>
                    <CardDescription className="text-slate-400 font-medium italic">High-fidelity visualization of lane congestion and port throughput stability.</CardDescription>
                 </div>
                 <Globe className="h-10 w-10 text-primary opacity-20 group-hover:rotate-45 transition-transform duration-1000" />
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar z-10 font-mono">
                 <div className="divide-y divide-white/5">
                    {routes.length === 0 && (
                       <div className="p-12 text-center">
                          <Ship className="h-10 w-10 mx-auto text-slate-700 mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">No active sea shipments</p>
                          <p className="text-[11px] text-slate-600 mt-1">Lanes appear here once a `mode: sea` shipment has an origin and destination port.</p>
                       </div>
                    )}
                    {routes.map((route, i) => (
                       <div key={route.id} className="p-6 flex items-center justify-between group/row hover:bg-white/[0.01] transition-colors">
                          <div className="flex items-center gap-6 flex-1 min-w-0">
                             <div className="h-14 w-20 rounded-2xl border-2 border-white/10 bg-slate-950 flex items-center justify-center shadow-inner group-hover/row:scale-105 transition-transform duration-500">
                                <Ship className="h-10 w-10 text-primary opacity-60" />
                             </div>
                             <div className="space-y-3 min-w-0">
                                <div className="flex items-center gap-4">
                                   <h3 className="text-2xl font-black uppercase tracking-tighter text-white truncate">{route.originPort} → {route.destinationPort}</h3>
                                   <Badge className={cn(
                                      "text-[9px] font-black h-6 px-3 rounded-full uppercase tracking-widest border-none shadow-sm",
                                      route.status === 'obstructed' ? "bg-orange-600" : "bg-emerald-600"
                                   )}>{route.status}</Badge>
                                </div>
                                <div className="flex items-center gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                   <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {route.originPort} ↔ {route.destinationPort}</span>
                                   <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {route.activeShipmentCount} active shipment{route.activeShipmentCount === 1 ? '' : 's'}</span>
                                </div>
                             </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 shrink-0 border-l-2 pl-12 border-white/5">
                             <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-slate-600 leading-none">Avg Transit</p>
                                <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{route.avgTransitDays != null ? `${route.avgTransitDays}d` : '—'}</p>
                             </div>
                             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 opacity-20 group-hover/row:opacity-100 transition-all">
                                <ArrowRight className="h-6 w-6 text-white" />
                             </Button>
                          </div>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* MARITIME SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
           {/* RISK ZONE PANEL */}
           <Card className="shadow-lg border-none bg-red-600 text-white relative overflow-hidden group rounded-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 scale-125 group-hover:scale-150 transition-transform duration-1000">
                 <Lock className="h-80 w-80 brightness-0 invert" />
              </div>
              <CardHeader className="pb-6 border-b border-red-500 p-6 relative">
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-4 text-white">
                    <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                    Critical Risk Zones
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6 relative space-y-8">
                 {risks.length === 0 && (
                    <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center space-y-2">
                       <p className="text-sm font-black uppercase tracking-wide">No active risk zones</p>
                       <p className="text-xs font-medium italic opacity-70 leading-relaxed">
                          No geopolitical/piracy/weather risk feed is connected yet — this panel reflects real
                          alerts only, not a placeholder threat list.
                       </p>
                    </div>
                 )}
                 {risks.map(risk => (
                    <div key={risk.id} className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md space-y-4">
                       <div className="flex items-center justify-between">
                          <Badge className="bg-white text-red-600 text-[9px] font-black border-none px-3 h-6 rounded-full">{risk.severity} LEVEL</Badge>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{risk.type}</span>
                       </div>
                       <h4 className="text-xl font-black uppercase tracking-tight">{risk.name}</h4>
                       <p className="text-sm font-medium italic opacity-80 leading-relaxed">"{risk.description}"</p>
                    </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="shadow-none border-none bg-slate-900/40 p-6 space-y-8 rounded-2xl">
              <div className="flex items-center justify-between">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Fleet Pulse</h4>
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-6">
                 {[
                   { label: 'Shipment Health', val: summary?.shipmentHealthPct != null ? `${summary.shipmentHealthPct}%` : '—', icon: ShieldCheck, color: 'text-emerald-500' },
                   { label: 'Active Alerts', val: summary?.activeAlerts ?? '—', icon: Radio, color: 'text-blue-500' },
                   { label: 'Total Tracked', val: summary?.totalShipments ?? '—', icon: Anchor, color: 'text-indigo-500' }
                 ].map(stat => (
                   <div key={stat.label} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-6">
                         <div className="p-4 rounded-3xl bg-slate-950 border border-white/5 shadow-inner group-hover:bg-white/5 transition-colors">
                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                      </div>
                      <span className="text-3xl font-black tracking-tighter text-white tabular-nums">{stat.val}</span>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="shadow-none border-none bg-slate-900/30 p-6 text-center space-y-8 rounded-2xl border-dashed border-white/5">
              <Waves className="h-12 w-16 mx-auto text-slate-700 opacity-20" />
              <div className="space-y-3">
                 <p className="text-sm font-black uppercase tracking-wide text-slate-400">Tracking Coverage</p>
                 <p className="text-xs font-medium italic leading-relaxed px-6 opacity-40 text-slate-500">
                    {routes.length} active sea lane{routes.length === 1 ? '' : 's'} across {summary?.totalShipments ?? 0} tracked shipment{summary?.totalShipments === 1 ? '' : 's'}, sourced live from trade-service.
                 </p>
              </div>
           </Card>
        </div>
      </div>
    </main>
  );
}
