'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Package, 
  Truck, 
  ChevronRight, 
  Search, 
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Receipt,
  X,
  Award
} from 'lucide-react';
import { Card } from "@/components/ui/card";
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
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

/**
 * Acquisition Registry: High-Detail Transactional Ledger.
 */
export default function AcquisitionsPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { transactions } = useAppStore();
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTx = transactions.find(t => t.id === selectedTxId);

  // Prevent hydration mismatch for dynamic timestamps
  const fulfillmentSteps = useMemo(() => {
    if (!mounted) return [];
    return [
      { step: 'Registry Confirmed', timestamp: new Date().toISOString(), completed: true },
      { step: 'Atelier Preparation', timestamp: '', completed: false },
      { step: 'Heritage Audit', timestamp: '', completed: false },
      { step: 'Institutional Dispatch', timestamp: '', completed: false },
      { step: 'White-Glove Delivery', timestamp: '', completed: false }
    ];
  }, [mounted]);

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Detail View Modal */}
      <Dialog open={!!selectedTxId} onOpenChange={() => setSelectedTxId(null)}>
        <DialogContent className="max-w-4xl bg-white border-none shadow-2xl rounded-none p-0 overflow-hidden">
          {selectedTx && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Sidebar Info */}
              <div className="md:w-1/3 bg-ivory p-10 border-r border-border space-y-10">
                <div className="space-y-4">
                  <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-plum/20 text-plum px-3 py-1">
                    {selectedTx.status}
                  </Badge>
                  <h3 className="text-2xl font-headline font-bold italic leading-tight text-gray-900">{selectedTx.artifactName || 'Artifact Acquisition'}</h3>
                  <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">REF: {selectedTx.id}</p>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center space-x-3 text-secondary">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Provenance Verified</span>
                   </div>
                   <div className="flex items-center space-x-3 text-secondary">
                      <Zap className="w-5 h-5" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Heritage Compliance OK</span>
                   </div>
                </div>

                <div className="pt-8 border-t border-border space-y-4">
                   <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">FINANCIAL LEDGER</p>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs font-light italic">
                         <span>Base Price</span>
                         <span className="font-body font-semibold tabular">${(selectedTx.netAmount || selectedTx.amount * 0.92).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs font-light italic">
                         <span>Regional Tax</span>
                         <span className="font-body font-semibold tabular">${(selectedTx.taxAmount || selectedTx.amount * 0.08).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                         <span>Total Yield</span>
                         <span className="font-body text-plum tabular">${selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Main Content: Tracking */}
              <div className="flex-1 p-12 space-y-12 bg-white">
                 <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold uppercase tracking-[0.4em]">Fulfillment Protocol</h4>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedTxId(null)}><X className="w-4 h-4" /></Button>
                 </div>

                 <div className="space-y-10">
                    {(selectedTx.fulfillmentSteps || fulfillmentSteps).map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-6 relative">
                         {idx < 4 && <div className={cn("absolute left-2.5 top-6 w-px h-10 bg-border", step.completed && "bg-plum")} />}
                         <div className={cn(
                           "w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-1000",
                           step.completed ? "bg-plum border-plum text-white shadow-lg" : "bg-white border-border text-gray-200"
                         )}>
                            {step.completed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                         </div>
                         <div className="space-y-1">
                            <p className={cn("text-xs font-bold uppercase tracking-tight", step.completed ? "text-gray-900" : "text-gray-300")}>{step.step}</p>
                            <p className="text-[9px] text-gray-400 font-mono uppercase">{step.timestamp ? new Date(step.timestamp).toLocaleString() : 'PENDING'}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="pt-12 border-t border-border flex flex-col sm:flex-row gap-4">
                    <Button className="flex-1 h-12 bg-black text-white hover:bg-plum rounded-none text-[9px] font-bold uppercase tracking-widest">
                       <Download className="w-3.5 h-3.5 mr-2" /> DOWNLOAD INVOICE
                    </Button>
                    <Link href={`/${countryCode}/account/certificates`} className="flex-1">
                       <Button variant="outline" className="w-full h-12 border-border rounded-none text-[9px] font-bold uppercase tracking-widest">
                          <Award className="w-3.5 h-3.5 mr-2" /> HERITAGE ARCHIVE
                       </Button>
                    </Link>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Acquisition Registry</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Acquisitions</h1>
          <p className="text-sm text-gray-500 font-light italic">Detailed ledger of your global Maison collection.</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input className="bg-white border border-border h-10 pl-10 pr-4 text-[9px] font-bold uppercase tracking-widest outline-none w-48 focus:ring-1 focus:ring-plum transition-all" placeholder="FILTER LEDGER..." />
           </div>
        </div>
      </header>

      <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
        <Table>
          <TableHeader className="bg-ivory/50">
            <TableRow>
              <TableHead className="text-[9px] uppercase font-bold pl-8">Artifact</TableHead>
              <TableHead className="text-[9px] uppercase font-bold">Provenance</TableHead>
              <TableHead className="text-[9px] uppercase font-bold">Acquisition Value</TableHead>
              <TableHead className="text-[9px] uppercase font-bold text-center">Protocol Status</TableHead>
              <TableHead className="text-[9px] uppercase font-bold text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx.id} className="hover:bg-ivory/30 transition-colors group cursor-pointer" onClick={() => setSelectedTxId(tx.id)}>
                <TableCell className="pl-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-12 bg-muted rounded-sm flex items-center justify-center text-[6px] font-bold text-gray-400 uppercase border border-border">Asset</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-tight text-gray-900 group-hover:text-plum transition-colors">{tx.artifactName || 'Heritage Transfer'}</span>
                      <span className="text-[8px] text-gray-400 uppercase font-mono">ID: {tx.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center space-x-2">
                      <ShieldCheck className={cn("w-3.5 h-3.5", tx.isProvenanceCertified ? "text-secondary" : "text-gray-200")} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{tx.country.toUpperCase()} Hub</span>
                   </div>
                </TableCell>
                <TableCell><span className="text-sm font-bold text-gray-900 font-body tabular">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn("text-[8px] uppercase tracking-tighter border-none", 
                    tx.status === 'Settled' ? 'bg-green-50 text-green-600' : 'bg-gold/10 text-gold'
                  )}>
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-plum" onClick={(e) => { e.stopPropagation(); setSelectedTxId(tx.id); }}><FileText className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-40 text-center opacity-30">
                   <Package className="w-12 h-12 mx-auto mb-4" />
                   <p className="text-sm font-bold uppercase tracking-widest italic">Your acquisition history is currently empty.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Logistics Support CTA */}
      <section className="bg-plum/5 py-12 px-10 border border-plum/10 rounded-sm flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center space-x-6">
            <div className="p-4 bg-white rounded-full text-plum"><Truck className="w-6 h-6" /></div>
            <div>
               <h4 className="text-lg font-headline font-bold italic">Logistical Assistance</h4>
               <p className="text-xs text-gray-500 font-light italic">Need help with high-fidelity delivery orchestration?</p>
            </div>
         </div>
         <Link href={`/${countryCode}/account/concierge`}>
            <Button className="rounded-none bg-black text-white hover:bg-plum text-[9px] font-bold uppercase tracking-widest h-12 px-10 transition-all">
               Contact Concierge <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
         </Link>
      </section>
    </div>
  );
}
