'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Video, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Play,
  ArrowRight,
  Info,
  Lock,
  Search,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

/**
 * Live Ateliers: Premium Video Curatorial Service.
 * Allows clients to request and manage live artifact viewings.
 * Charged via Platform Maison Wallet.
 */
export default function LiveAteliersPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { activeVip, products, requestLiveSession } = useAppStore();
  const { toast } = useToast();
  
  const [isRequestModalOpen, setIsRequestOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleRequestLive = (productId: string, productName: string) => {
    const success = requestLiveSession(productId, productName);
    if (success) {
      setIsRequestOpen(false);
      toast({
        title: "Live Viewing Requested",
        description: "A curatorial fee of $250 has been settled from your Treasury.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Treasury Liquidity Insufficient",
        description: "Please top up your Maison Treasury to proceed with live curatorial services.",
      });
    }
  };

  if (!activeVip) return null;

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-none p-0 overflow-hidden">
           <div className="p-10 space-y-10">
              <div className="flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-headline font-bold italic text-gray-900 uppercase tracking-widest">Live Curatorial</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Platform Service Request</p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsRequestOpen(false)}><X className="w-4 h-4" /></Button>
              </div>

              <div className="p-6 bg-plum/5 border border-plum/10 text-center space-y-4">
                 <p className="text-[11px] text-plum font-light italic leading-relaxed">
                   "A private live viewing incurs a service fee of <span className="font-bold">$250.00</span> per artifact. This fee includes a 30-minute high-fidelity digital session with a senior curator."
                 </p>
              </div>

              <div className="space-y-6">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input 
                      className="w-full bg-ivory border border-border h-14 pl-12 pr-4 text-xs italic font-light outline-none focus:border-plum" 
                      placeholder="Find artifact in global registry..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="p-4 border border-border flex items-center justify-between group hover:border-plum transition-all bg-white">
                         <div className="flex items-center space-x-4">
                            <div className="w-10 h-12 bg-ivory border border-border flex items-center justify-center text-[6px] font-bold text-gray-300 uppercase">Asset</div>
                            <div className="flex flex-col">
                               <span className="text-xs font-bold uppercase tracking-tight text-gray-900">{p.name}</span>
                               <span className="text-[8px] text-gray-400 font-mono uppercase">ID: {p.id}</span>
                            </div>
                         </div>
                         <Button 
                          className="h-9 px-6 rounded-none bg-black text-white hover:bg-plum text-[8px] font-bold uppercase tracking-widest"
                          onClick={() => handleRequestLive(p.id, p.name)}
                         >
                            REQUEST VIEWING
                         </Button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Live Atelier Services</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Live Ateliers</h1>
          <p className="text-sm text-gray-500 font-light italic">High-fidelity digital curatorial sessions.</p>
        </div>
        <Button 
          className="h-14 px-10 rounded-none bg-plum text-white hover:bg-black transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-plum/20"
          onClick={() => setIsRequestOpen(true)}
        >
          <Plus className="w-4 h-4 mr-3" /> NEW LIVE REQUEST
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
           <Card className="bg-white border-border shadow-sm overflow-hidden rounded-none">
              <Table>
                 <TableHeader className="bg-ivory/50">
                    <TableRow>
                       <TableHead className="text-[9px] uppercase font-bold pl-8">Artifact</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold">Request Date</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold">Scheduled Time</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-center">Status</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-right pr-8">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {activeVip.liveRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-ivory/30 transition-colors">
                         <TableCell className="pl-8">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold uppercase tracking-tight text-gray-900">{req.productName}</span>
                               <span className="text-[8px] text-gray-400 font-mono">ID: {req.id}</span>
                            </div>
                         </TableCell>
                         <TableCell>
                            <span className="text-[10px] text-gray-400 font-medium">{new Date(req.requestedAt).toLocaleDateString()}</span>
                         </TableCell>
                         <TableCell>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-plum">
                               {req.scheduledAt ? new Date(req.scheduledAt).toLocaleString() : 'PENDING SCHEDULE'}
                            </span>
                         </TableCell>
                         <TableCell className="text-center">
                            <Badge variant="outline" className={cn(
                              "text-[8px] uppercase tracking-tighter border-none",
                              req.status === 'scheduled' ? 'bg-gold/10 text-gold' : 
                              req.status === 'active' ? 'bg-green-50 text-green-600 animate-pulse' :
                              'bg-slate-50 text-slate-400'
                            )}>
                               {req.status}
                            </Badge>
                         </TableCell>
                         <TableCell className="text-right pr-8">
                            {req.status === 'active' ? (
                              <Button size="sm" className="h-8 bg-black text-white hover:bg-plum text-[8px] font-bold uppercase tracking-widest">
                                 <Play className="w-3 h-3 mr-2" /> JOIN ATELIER
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-plum"><Info className="w-4 h-4" /></Button>
                            )}
                         </TableCell>
                      </TableRow>
                    ))}
                    {activeVip.liveRequests.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={5} className="py-40 text-center opacity-30">
                            <Video className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest italic">No live curatorial sessions recorded.</p>
                         </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
              </Table>
           </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
           <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Zap className="w-32 h-32" /></div>
              <div className="space-y-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Live Protocol</h4>
                 <div className="space-y-6">
                    <BenefitItem icon={<ShieldCheck className="w-4 h-4 text-gold" />} label="Verified Provenance" desc="Curators reveal hidden marks and archival serials." />
                    <BenefitItem icon={<Zap className="w-4 h-4 text-gold" />} label="High-Fidelity Optical" desc="4K macro lenses for absolute surface transparency." />
                    <BenefitItem icon={<Lock className="w-4 h-4 text-gold" />} label="Private Dialogue" desc="Direct audio communication with the central atelier." />
                 </div>
              </div>
           </Card>

           <Card className="bg-ivory border border-border p-8 space-y-6 rounded-none">
              <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Platform Treasury</h4>
                 <Link href={`/${countryCode}/account/wallet`} className="text-[8px] font-bold uppercase text-plum hover:text-gold transition-colors">Top up</Link>
              </div>
              <div className="text-3xl font-headline font-bold italic text-gray-900">
                 ${activeVip.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[9px] text-gray-400 italic">"Sufficient for live sessions."</p>
           </Card>
        </aside>
      </div>
    </div>
  );
}

function BenefitItem({ icon, label, desc }: { icon: any, label: string, desc: string }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="mt-1">{icon}</div>
      <div className="space-y-1">
        <h4 className="text-[10px] font-bold uppercase tracking-widest">{label}</h4>
        <p className="text-[11px] text-white/40 italic font-light leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
