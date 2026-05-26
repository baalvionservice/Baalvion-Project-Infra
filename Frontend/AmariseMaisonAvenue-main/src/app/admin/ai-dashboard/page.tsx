
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Activity, 
  ChevronRight, 
  RefreshCcw,
  CheckCircle2,
  Clock,
  BarChart,
  Crown,
  Cpu,
  Settings,
  BrainCircuit,
  Database,
  TrendingUp,
  Tag,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAI } from '@/hooks/use-ai';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getAnalytics } from '@/lib/analytics/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

/**
 * AI Autopilot: High-Frequency Automation Terminal
 */
export default function AIDashboard() {
  const { modules, logs, runSequence } = useAI();
  const { currentUser, scopedPricingOptimizations, optimizeRegistryPricing, adminJurisdiction } = useAppStore();
  const { toast } = useToast();

  const stats = useMemo(() => {
    if (!currentUser) return null;
    return getAnalytics(currentUser.role, currentUser.country);
  }, [currentUser]);

  const handleBatchGeneration = () => {
    toast({
      title: "Batch Generation Initiated",
      description: "AI is crafting market-specific SEO descriptors for the registry.",
    });
    runSequence('SEO Metadata Cycle', currentUser?.country);
  };

  const handlePricingCycle = () => {
    const hub = adminJurisdiction === 'global' ? 'us' : adminJurisdiction;
    optimizeRegistryPricing(hub as any);
    toast({
      title: "Neural Pricing Cycle Active",
      description: `Optimizing artifact yield for the ${hub.toUpperCase()} hub based on scarcity signals.`,
    });
  };

  if (!stats) return null;

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href="/admin">Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Autonomous Operations</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">AI Autopilot</h1>
          <p className="text-sm text-gray-500 font-light italic">Orchestrating high-volume curatorial and business logic.</p>
        </div>
        <div className="flex items-center space-x-4">
           <Button variant="outline" className="h-14 px-8 rounded-none border-plum text-plum hover:bg-plum hover:text-white transition-all text-[10px] font-bold uppercase tracking-[0.4em]" onClick={handlePricingCycle}>
             <Tag className="w-4 h-4 mr-3" /> NEURAL PRICING CYCLE
           </Button>
           <Button className="h-14 px-10 rounded-none bg-plum text-white hover:bg-black transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-plum/20" onClick={handleBatchGeneration}>
             <Zap className="w-4 h-4 mr-3" /> BATCH GENERATE METADATA
           </Button>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border-b border-border h-14 w-full justify-start p-0 rounded-none space-x-12 mb-12">
          <TabsTrigger value="overview" className="tab-trigger">Efficiency Overview</TabsTrigger>
          <TabsTrigger value="pricing" className="tab-trigger">Neural Pricing {scopedPricingOptimizations.length > 0 && <span className="ml-2 w-2 h-2 bg-plum rounded-full" />}</TabsTrigger>
          <TabsTrigger value="sentiment" className="tab-trigger">Market Sentiment</TabsTrigger>
          <TabsTrigger value="logs" className="tab-trigger">Automation Logs</TabsTrigger>
          <TabsTrigger value="parameters" className="tab-trigger">Neural Parameters</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-12 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <StatsTile label="Autonomous Accuracy" value="95.2%" trend="Neural Confidence" />
              <StatsTile label="Requests Processed" value="1.2M" trend="+14.2% Vol" />
              <StatsTile label="Mean Response" value="142ms" trend="Optimal" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <Card className="lg:col-span-8 bg-white border-border shadow-luxury overflow-hidden">
                <CardHeader className="border-b border-border">
                   <CardTitle className="font-headline text-2xl">Learning Trajectory</CardTitle>
                   <CardDescription className="text-[10px] uppercase tracking-widest">Model alignment efficacy over 30 days</CardDescription>
                </CardHeader>
                <CardContent className="p-8 h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.aiPerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip contentStyle={{ borderRadius: '0px', border: '1px solid #eee' }} />
                        <Line type="monotone" dataKey="score" stroke="#7E3F98" strokeWidth={3} dot={{fill: '#7E3F98'}} />
                      </LineChart>
                   </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-4 bg-black text-white p-10 flex flex-col justify-center space-y-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 p-12 opacity-10 pointer-events-none"><Cpu className="w-40 h-40" /></div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-headline font-bold italic tracking-tight">System Pulse</h3>
                    <p className="text-sm font-light italic text-white/60 leading-relaxed">
                      "Autonomous business orchestration is currently maintaining a high-fidelity sync across all five Maison hubs."
                    </p>
                 </div>
                 <div className="space-y-6 pt-6 border-t border-white/10">
                    {stats.regionalAiPerformance.map(reg => (
                      <div key={reg.code} className="space-y-2">
                         <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.3em]">
                            <span className="opacity-60">{reg.country} Hub</span>
                            <span className="text-gold">{reg.score}%</span>
                         </div>
                         <div className="h-0.5 bg-white/10 w-full rounded-full overflow-hidden">
                            <div className="h-full bg-gold" style={{ width: `${reg.score}%` }} />
                         </div>
                      </div>
                    ))}
                 </div>
                 <Link href="/admin/automation">
                    <Button variant="outline" className="w-full rounded-none border-white/20 text-white/60 hover:bg-white hover:text-black text-[9px] font-bold uppercase tracking-widest h-12 mt-4">
                      MANAGE LOGIC RULES
                    </Button>
                 </Link>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-12 animate-fade-in">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-8">
                 <div className="bg-plum/5 p-8 border border-plum/10 space-y-4">
                    <div className="flex items-center space-x-3 text-plum">
                       <TrendingUp className="w-5 h-5" />
                       <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Dynamic Value Optimization</h3>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "AI analyzes registry scarcity and market resonance to protect Maison margins. Prices adjust within strictly governed integrity rails."
                    </p>
                 </div>

                 <Card className="bg-white border-border shadow-luxury overflow-hidden">
                    <Table>
                       <TableHeader className="bg-ivory/50">
                          <TableRow>
                             <TableHead className="text-[9px] uppercase font-bold pl-8">Artifact</TableHead>
                             <TableHead className="text-[9px] uppercase font-bold">Delta Logic</TableHead>
                             <TableHead className="text-[9px] uppercase font-bold">Base Price</TableHead>
                             <TableHead className="text-[9px] uppercase font-bold text-right pr-8">Optimized</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {scopedPricingOptimizations.map(price => (
                            <TableRow key={price.id} className="hover:bg-ivory/30 transition-colors group">
                               <TableCell className="pl-8">
                                  <div className="flex flex-col">
                                     <span className="text-xs font-bold uppercase tracking-tight text-gray-900 group-hover:text-plum transition-colors">{price.productId}</span>
                                     <span className="text-[8px] text-gray-400 uppercase tracking-widest">{price.country.toUpperCase()} HUB</span>
                                  </div>
                               </TableCell>
                               <TableCell>
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-plum/20 text-plum">
                                     {price.reason}
                                  </Badge>
                               </TableCell>
                               <TableCell><span className="text-xs text-gray-400 line-through tabular">${price.basePrice.toLocaleString()}</span></TableCell>
                               <TableCell className="text-right pr-8">
                                  <div className="flex flex-col items-end">
                                     <span className={cn("text-sm font-bold tabular", price.adjustedPrice > price.basePrice ? "text-emerald-600" : "text-red-600")}>
                                        ${price.adjustedPrice.toLocaleString()}
                                     </span>
                                     <span className="text-[7px] font-bold uppercase text-gray-300">Conf: {Math.round(price.confidenceScore * 100)}%</span>
                                  </div>
                               </TableCell>
                            </TableRow>
                          ))}
                          {scopedPricingOptimizations.length === 0 && (
                            <TableRow>
                               <TableCell colSpan={4} className="py-40 text-center opacity-30">
                                  <Tag className="w-12 h-12 mx-auto mb-4" />
                                  <p className="text-sm font-bold uppercase tracking-widest italic">Neural Pricing Engine Standby</p>
                               </TableCell>
                            </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </Card>
              </div>

              <aside className="lg:col-span-4 space-y-8">
                 <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><ShieldCheck className="w-32 h-32" /></div>
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Maison Integrity Rails</h4>
                       <div className="space-y-6">
                          <RailItem label="Maximum Scarcity Cap" val="+20%" />
                          <RailItem label="Inventory Liquidate Cap" val="-30%" />
                          <RailItem label="Stability Window" val="24 Hours" />
                       </div>
                    </div>
                    <Button variant="outline" className="w-full border-white/20 text-white/60 h-12 rounded-none text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black">
                       CONFIGURE SAFETY RAILS
                    </Button>
                 </Card>
              </aside>
           </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-12 animate-fade-in">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-8">
                 <div className="bg-plum/5 p-8 border border-plum/10 space-y-4">
                    <div className="flex items-center space-x-3 text-plum">
                       <BarChart className="w-5 h-5" />
                       <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Connoisseur Resonancy Matrix</h3>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      "Real-time sentiment tracking of global collectors. AI analyzes search patterns and private brief language to detect market shifts."
                    </p>
                 </div>

                 <div className="grid grid-cols-1 gap-6">
                    <SentimentCard 
                      hub="UAE" 
                      topic="High Complication Watches" 
                      sentiment="Extreme Bullish" 
                      signal="Lead language shifting from 'value' to 'heritage scarcity'."
                    />
                    <SentimentCard 
                      hub="India" 
                      topic="Artisanal Silk Archive" 
                      sentiment="Rising Resonance" 
                      signal="Significant spike in intent from Tier 1 connoisseurs in Mumbai."
                    />
                    <SentimentCard 
                      hub="USA" 
                      topic="Exotic Birkin Series" 
                      sentiment="Stable" 
                      signal="Traditional seasonal patterns observed. Registry engagement optimal."
                    />
                 </div>
              </div>

              <aside className="lg:col-span-4 space-y-8">
                 <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Crown className="w-32 h-32" /></div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Owner Insight</h4>
                    <p className="text-sm font-light italic leading-relaxed opacity-70">
                      "The surge in UAE horological resonance suggests a 24% increase in upcoming auction liquidity. Recommend prioritizing the 1924 Grand Complications for the Dubai salon."
                    </p>
                    <Link href="/admin/super">
                      <Button variant="outline" className="w-full border-gold/40 text-gold rounded-none text-[9px] font-bold uppercase h-12 hover:bg-gold hover:text-black transition-all">
                         EXECUTE STRATEGIC SHIFT
                      </Button>
                    </Link>
                 </Card>
              </aside>
           </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-8 animate-fade-in">
           <Card className="bg-white border-border shadow-luxury overflow-hidden">
              <Table>
                <TableHeader className="bg-ivory/50">
                  <TableRow>
                    <TableHead className="text-[9px] uppercase font-bold pl-8">Protocol</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">Action</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">Timestamp</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} className="hover:bg-ivory/30 transition-colors">
                      <TableCell className="pl-8 font-bold text-[10px] uppercase tracking-widest text-plum">{log.moduleId}</TableCell>
                      <TableCell className="text-xs font-light italic text-gray-600">"{log.action}"</TableCell>
                      <TableCell className="text-[9px] text-gray-400 font-mono uppercase">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-green-200 text-green-600 bg-green-50">{log.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </Card>
           <div className="flex justify-end">
              <Link href="/admin/qa">
                <Button variant="ghost" className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-plum">
                  VIEW FULL EXECUTION TRACES <ChevronRight className="w-3 h-3 ml-2" />
                </Button>
              </Link>
           </div>
        </TabsContent>

        <TabsContent value="parameters" className="animate-fade-in space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <Card className="bg-white border-border shadow-luxury p-10 space-y-8">
                 <div className="flex items-center space-x-4 text-plum">
                    <Settings className="w-6 h-6" />
                    <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest">Automation Levels</h3>
                 </div>
                 <p className="text-sm text-gray-500 font-light italic leading-relaxed">
                   Define the degree of autonomous intervention across Maison business logic. `Assisted` requires curatorial oversight before execution.
                 </p>
                 <div className="space-y-6 pt-4 border-t border-border">
                    {modules.map(mod => (
                      <div key={mod.id} className="flex justify-between items-center">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">{mod.name}</span>
                         <Link href="/admin/ai-control">
                           <Badge className="bg-plum text-white text-[8px] uppercase tracking-widest px-3 py-1 cursor-pointer hover:bg-black transition-all">
                              {mod.level}
                           </Badge>
                         </Link>
                      </div>
                    ))}
                 </div>
              </Card>

              <Card className="bg-white border-border shadow-luxury p-10 space-y-8 border-l-4 border-l-gold">
                 <div className="flex items-center space-x-4 text-gold">
                    <Database className="w-6 h-6" />
                    <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest">Memory Isolation</h3>
                 </div>
                 <p className="text-sm text-gray-500 font-light italic leading-relaxed">
                   Enforce strict regional hub context for AI memory to prevent data leakage between non-synergistic market hubs.
                 </p>
                 <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Cross-Hub Isolation Active</span>
                    <Switch defaultChecked className="data-[state=checked]:bg-gold" />
                 </div>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RailItem({ label, val }: { label: string, val: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-3">
       <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">{label}</span>
       <span className="text-[10px] font-bold text-white/80 tabular">{val}</span>
    </div>
  );
}

function SentimentCard({ hub, topic, sentiment, signal }: { hub: string, topic: string, sentiment: string, signal: string }) {
  return (
    <Card className="bg-white border-border shadow-sm group hover:border-plum transition-all overflow-hidden rounded-none p-8 flex flex-col space-y-4">
       <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-[8px] uppercase tracking-widest text-slate-400 border-slate-100">{hub} HUB</Badge>
          <span className="text-[9px] font-bold text-plum uppercase tracking-widest">{sentiment}</span>
       </div>
       <div className="space-y-1">
          <h4 className="text-sm font-bold uppercase tracking-tight text-slate-900">{topic}</h4>
          <p className="text-[10px] text-slate-400 italic">Signal: "{signal}"</p>
       </div>
    </Card>
  );
}

function StatsTile({ label, value, trend }: { label: string, value: string, trend: string }) {
  return (
    <Card className="bg-white border-border shadow-luxury p-8 space-y-4 group hover:border-plum transition-all">
       <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 group-hover:text-plum transition-colors">{label}</span>
          <Badge variant="outline" className="text-[8px] uppercase">{trend}</Badge>
       </div>
       <div className="text-4xl font-headline font-bold italic text-gray-900">{value}</div>
    </Card>
  );
}
