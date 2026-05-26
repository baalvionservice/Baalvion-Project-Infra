'use client';

import React, { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Crown, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  ArrowRight,
  Package,
  Star,
  Sparkles,
  Search,
  LayoutDashboard,
  Shield,
  Wallet,
  Video,
  LineChart,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';

/**
 * Connoisseur Dashboard: Persona-Aware Environment.
 * Refined for Platform Owners with Strategic AI Signals & Collection Strategy.
 */
export default function ConnoisseurDashboard() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { currentUser, transactions, privateInquiries, activeVip } = useAppStore();

  const isPremium = useMemo(() => 
    activeVip?.tier === 'Diamond' || activeVip?.tier === 'Gold',
  [activeVip]);

  const stats = useMemo(() => {
    return {
      loyaltyPoints: activeVip?.loyaltyPoints || 0,
      nextTierAt: 15000,
      activeAcquisitions: transactions.filter(t => t.status !== 'Closed').length,
      curatorialSignals: privateInquiries.filter(i => i.status === 'closing').length,
      walletBalance: activeVip?.walletBalance || 0,
      totalCollectionValue: transactions.reduce((acc, t) => acc + t.amount, 0) * 1.14 // Mocked 14% appreciation
    };
  }, [transactions, privateInquiries, activeVip]);

  if (isPremium) {
    return <PremiumSalonDashboard countryCode={countryCode} stats={stats} transactions={transactions} currentUser={currentUser} activeVip={activeVip} />;
  }

  return <NormalRegistryDashboard countryCode={countryCode} stats={stats} transactions={transactions} currentUser={currentUser} activeVip={activeVip} />;
}

/**
 * Design B: The Private Salon (Premium)
 */
function PremiumSalonDashboard({ countryCode, stats, transactions, currentUser, activeVip }: any) {
  const appreciationData = [
    { month: 'Oct', value: 124000 },
    { month: 'Nov', value: 132000 },
    { month: 'Dec', value: 145000 },
    { month: 'Jan', value: 142000 },
    { month: 'Feb', value: 158000 },
    { month: 'Mar', value: 174000 },
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-plum">Maison Private Salon</span>
          <h1 className="text-5xl font-headline font-bold italic text-gray-900 tracking-tight leading-none">Bonjour, {currentUser?.name.split(' ')[0]}</h1>
          <p className="text-gray-500 font-light italic mt-2">"A testament to your pursuit of human brilliance."</p>
        </div>
        <div className="flex items-center space-x-4">
           <Badge variant="outline" className="bg-plum/5 text-plum border-plum/20 h-10 px-6 rounded-none text-[10px] font-bold uppercase tracking-widest">
             {activeVip?.tier} Connoisseur
           </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <DashboardCard label="Maison Treasury" value={`$${stats.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<Wallet className="w-5 h-5 text-gold" />}>
           <Link href={`/${countryCode}/account/wallet`}>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-[9px] font-bold uppercase tracking-widest text-plum hover:text-gold">MANAGE LIQUIDITY <ArrowRight className="ml-2 w-3 h-3" /></Button>
           </Link>
        </DashboardCard>

        <DashboardCard label="Collection Value" value={`$${stats.totalCollectionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp className="w-5 h-5 text-gold" />}>
           <div className="flex items-center space-x-2 text-[10px] font-bold uppercase text-green-600">
              <Sparkles className="w-3 h-3" />
              <span className="tabular">+14.2% Appreciation</span>
           </div>
        </DashboardCard>

        <DashboardCard label="Curator Signals" value={stats.curatorialSignals} icon={<Zap className="w-5 h-5 text-plum" />}>
           <p className="text-[10px] text-gray-400 italic">Direct responses from the atelier.</p>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
           {/* Section: Strategic Yield (Appreciation Chart) */}
           <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
              <CardHeader className="bg-ivory/30 border-b border-border p-8">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <div className="flex items-center space-x-3 text-plum">
                          <LineChart className="w-4 h-4" />
                          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.4em]">Strategic Yield</CardTitle>
                       </div>
                       <h4 className="text-2xl font-headline font-bold italic">Portfolio Appreciation</h4>
                    </div>
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-green-100 text-green-600 bg-green-50">+14.2% 12M Yield</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-10 h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={appreciationData}>
                       <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#7E3F98" stopOpacity={0.15}/>
                             <stop offset="95%" stopColor="#7E3F98" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999', fontWeight: 700}} />
                       <YAxis hide />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '0px' }}
                          labelStyle={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}
                       />
                       <Area type="monotone" dataKey="value" stroke="#7E3F98" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>

           <div className="bg-ivory border border-border p-10 space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
                 <Target className="w-64 h-64 text-black" />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center space-x-3 text-plum">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em]">Collection Strategy</h3>
                 </div>
                 <h4 className="text-3xl font-headline font-bold italic text-gray-900">Synergistic Allocation</h4>
              </div>
              <p className="text-sm font-light italic text-gray-600 leading-relaxed max-w-xl">
                "Our AI suggests diversifying your archive with a structural horological piece to optimize long-term resonance."
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                 <StrategySuggestion label="Watch Series" value="Grand Complication" price="$45k" />
                 <StrategySuggestion label="Couture Piece" value="Atelier Reserve Gown" price="$12k" />
              </div>
           </div>
        </div>

        <aside className="lg:col-span-4 space-y-8">
           <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Video className="w-32 h-32" /></div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Live Atelier</h4>
                 <p className="text-sm font-light italic leading-relaxed opacity-70">
                   "Experience artisanal detail through our high-fidelity curatorial lens. Private viewing sessions are active."
                 </p>
              </div>
              <Link href={`/${countryCode}/account/live`}>
                <Button variant="outline" className="w-full border-gold/40 text-gold rounded-none text-[9px] font-bold uppercase h-12 hover:bg-gold hover:text-black">
                   JOIN ATELIER
                </Button>
              </Link>
           </Card>

           <Card className="bg-white border border-border p-8 space-y-6 shadow-sm rounded-none">
              <div className="flex items-center space-x-3 text-plum">
                 <Star className="w-5 h-5 text-gold fill-gold" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest">Resonance</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between text-[9px] font-bold uppercase">
                    <span className="text-gray-400">Next Plateau</span>
                    <span className="text-plum tabular">{stats.nextTierAt.toLocaleString()}</span>
                 </div>
                 <Progress value={(stats.loyaltyPoints / stats.nextTierAt) * 100} className="h-1 bg-ivory" />
                 <p className="text-[9px] text-gray-400 italic">"Progressing toward Heritage Master tier."</p>
              </div>
           </Card>
        </aside>
      </div>
    </div>
  );
}

/**
 * Design A: The Institutional Registry (Normal)
 */
function NormalRegistryDashboard({ countryCode, stats, transactions, currentUser, activeVip }: any) {
  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end border-b border-border pb-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2">
             <div className="p-2 bg-slate-100 rounded-none text-slate-400 border border-slate-200"><LayoutDashboard className="w-4 h-4" /></div>
             <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400">Institutional Registry</span>
          </div>
          <h1 className="text-4xl font-headline font-bold text-gray-900 uppercase tracking-tight">Account Overview</h1>
          <p className="text-sm text-gray-500 font-light italic">Managing collection registry for {currentUser?.name}.</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="text-right mr-4">
              <p className="text-[8px] font-bold uppercase text-gray-400">Treasury</p>
              <p className="text-sm font-bold text-gray-900 tabular">${stats.walletBalance.toLocaleString()}</p>
           </div>
           <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 h-9 px-4 rounded-none text-[9px] font-bold uppercase tracking-widest">
             Standard Collector
           </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <RegistryStat label="Maison Treasury" value={`$${stats.walletBalance.toLocaleString()}`} icon={<Wallet className="w-4 h-4" />} />
         <RegistryStat label="Loyalty Points" value={stats.loyaltyPoints} icon={<Star className="w-4 h-4" />} />
         <RegistryStat label="Live Requests" value={activeVip?.liveRequests?.length || 0} icon={<Video className="w-4 h-4" />} />
         <RegistryStat label="Compliance" value="Verified" icon={<ShieldCheck className="w-4 h-4" />} color="text-green-600" />
      </div>

      <div className="space-y-6">
         <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">RECENT ACQUISITIONS</h3>
         <div className="bg-white border border-border shadow-sm overflow-hidden">
            {transactions.length > 0 ? (
              <div className="divide-y divide-border">
                {transactions.slice(0, 3).map((tx: any) => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div className="flex items-center space-x-6">
                        <div className="w-10 h-12 bg-slate-100 flex items-center justify-center text-[6px] font-bold text-slate-400 uppercase border border-slate-200">Asset</div>
                        <div>
                           <p className="text-xs font-bold uppercase tracking-tight text-gray-900">{tx.artifactName || 'Acquisition Entry'}</p>
                           <p className="text-[9px] text-gray-400 font-mono">REF: {tx.id}</p>
                        </div>
                     </div>
                     <Badge variant="outline" className="text-[8px] uppercase tracking-widest">{tx.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center opacity-30">
                 <p className="text-[10px] font-bold uppercase tracking-widest italic">Registry empty.</p>
              </div>
            )}
            <Link href={`/${countryCode}/account/acquisitions`} className="block bg-slate-50 p-4 text-center border-t border-border group">
               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-gray-900 transition-colors">View All Registry Entries</span>
            </Link>
         </div>
      </div>
    </div>
  );
}

function DashboardCard({ label, value, icon, children }: any) {
  return (
    <Card className="bg-white border-border shadow-luxury p-8 space-y-6 group hover:border-plum transition-all rounded-none">
       <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-plum transition-colors">{label}</span>
          {icon}
       </div>
       <div className="text-4xl font-body font-bold italic text-gray-900 leading-none tabular">{value}</div>
       {children}
    </Card>
  );
}

function RegistryStat({ label, value, icon, color = "text-gray-900" }: any) {
  return (
    <Card className="bg-white border-border shadow-sm p-6 flex flex-col items-center justify-center space-y-3 hover:border-slate-900 transition-all rounded-none">
       <div className="p-2 bg-slate-50 rounded-full text-slate-400">{icon}</div>
       <div className="text-center">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
          <p className={cn("text-xl font-body font-bold tabular", color)}>{value}</p>
       </div>
    </Card>
  );
}

function StrategySuggestion({ label, value, price }: { label: string, value: string, price: string }) {
  return (
    <div className="p-4 bg-white border border-border flex-1 group hover:border-plum transition-all cursor-pointer">
       <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
       <div className="flex justify-between items-end mt-1">
          <p className="text-xs font-bold uppercase tracking-tight text-gray-900">{value}</p>
          <span className="text-[10px] font-bold text-plum tabular">{price}</span>
       </div>
    </div>
  );
}
