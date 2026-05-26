'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Globe,
  Package,
  ArrowRight,
  Info,
  ExternalLink,
  Zap,
  AlertTriangle,
  RotateCcw,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

/**
 * Logistics Hub: Tactical Dispatch Control Center.
 */
export default function LogisticsHub() {
  const { scopedShipments, scopedTransactions, createShipment, updateShipmentStatus, activeHub, currentUser } = useAppStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const pendingOrders = scopedTransactions.filter(t => t.status === 'Settled' || t.status === 'Paid');

  const handleCreateShipment = (orderId: string, userId: string) => {
    createShipment(orderId, userId, activeHub as any);
    toast({ title: "Dispatch Protocol Initialized", description: `Shipment record generated for Order ${orderId}.` });
  };

  const handleStatusUpdate = (id: string, status: any) => {
    updateShipmentStatus(id, status);
    toast({ title: "Transit Status Updated", description: `Shipment ${id} is now ${status}.` });
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
             <Truck className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Dispatch Protocol</span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase">Logistics Matrix</h1>
          <p className="text-sm text-white/40 font-light italic">Orchestrating global white-glove dispatch and archival transit.</p>
        </div>
        <div className="flex items-center space-x-4">
           <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-none h-10 px-6 rounded-none text-[10px] font-bold uppercase tracking-widest">
             Hub Node: {(activeHub || '').toUpperCase()}
           </Badge>
        </div>
      </header>

      <Tabs defaultValue="transit" className="w-full">
        <TabsList className="bg-[#111113] border border-white/5 h-14 w-full justify-start p-1 rounded-none space-x-2 mb-10">
          <TabsTrigger value="transit" className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">Transit Monitor</TabsTrigger>
          <TabsTrigger value="pending" className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">Dispatch Queue ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="kpis" className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">Logistics Yield</TabsTrigger>
        </TabsList>

        <TabsContent value="transit" className="space-y-8 animate-fade-in">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <LogisticsStat label="In Transit" value={scopedShipments.filter(s => s.status === 'in_transit').length} color="text-blue-400" />
              <LogisticsStat label="Out for Delivery" value={scopedShipments.filter(s => s.status === 'out_for_delivery').length} color="text-emerald-400" />
              <LogisticsStat label="Failed Dispatches" value={scopedShipments.filter(s => s.status === 'failed').length} color="text-red-500" />
              <LogisticsStat label="Successful Arrivals" value={scopedShipments.filter(s => s.status === 'delivered').length} color="text-emerald-500" />
           </div>

           <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
              <Table>
                 <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                       <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Tracking ID</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Artifact Order</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Courier</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-center text-white/40">Lifecycle</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {scopedShipments.map(shipment => (
                      <TableRow key={shipment.id} className="hover:bg-white/5 transition-colors border-white/5 h-20">
                         <TableCell className="pl-8 font-mono text-[10px] text-blue-400 uppercase">{shipment.trackingId}</TableCell>
                         <TableCell>
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-white/80 uppercase">Order: {shipment.orderId}</span>
                               <span className="text-[8px] text-white/20 uppercase tracking-widest">{(shipment.country || '').toUpperCase()} Hub Node</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-[10px] font-bold text-white/40 uppercase">{shipment.courierName}</TableCell>
                         <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[7px] uppercase border-none px-2", 
                              shipment.status === 'delivered' ? "bg-emerald-500/10 text-emerald-400" :
                              shipment.status === 'failed' ? "bg-red-500/10 text-red-500" :
                              "bg-blue-500/10 text-blue-400"
                            )}>{(shipment.status || '').replace('_', ' ')}</Badge>
                         </TableCell>
                         <TableCell className="text-right pr-8">
                            <div className="flex justify-end space-x-2">
                               {(['in_transit', 'delivered', 'failed'] as const).map(s => (
                                 <button 
                                  key={s} 
                                  onClick={() => handleStatusUpdate(shipment.id, s)}
                                  className={cn(
                                    "px-2 py-1 text-[7px] font-bold uppercase tracking-widest border transition-all",
                                    shipment.status === s ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:text-white"
                                  )}
                                 >
                                   {s.replace('_', ' ')}
                                 </button>
                               ))}
                            </div>
                         </TableCell>
                      </TableRow>
                    ))}
                    {scopedShipments.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={5} className="py-40 text-center opacity-20">
                            <Box className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No Active Transit Logs</p>
                         </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="pending" className="animate-fade-in space-y-8">
           <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
              <Table>
                 <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                       <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Order Ref</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Connoisseur</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Value</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {pendingOrders.map(order => (
                      <TableRow key={order.id} className="hover:bg-white/5 transition-colors border-white/5 h-16">
                         <TableCell className="pl-8 font-mono text-xs text-plum uppercase">{order.id}</TableCell>
                         <TableCell className="text-xs font-bold text-white/80 uppercase">{order.clientName}</TableCell>
                         <TableCell className="text-sm font-bold text-white tabular">${order.amount.toLocaleString()}</TableCell>
                         <TableCell className="text-right pr-8">
                            <Button 
                              className="h-8 bg-blue-600 text-white hover:bg-blue-500 rounded-none text-[8px] font-bold uppercase tracking-widest"
                              onClick={() => handleCreateShipment(order.id, 'guest')}
                            >
                               INITIATE DISPATCH
                            </Button>
                         </TableCell>
                      </TableRow>
                    ))}
                    {pendingOrders.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={4} className="py-40 text-center opacity-20">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Dispatch Queue Clear</p>
                         </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>
      </Tabs>

      {/* Strategy Node */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8">
            <Card className="bg-black text-white p-12 space-y-10 shadow-2xl relative overflow-hidden rounded-none border-none">
               <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                  <Globe className="w-64 h-64 text-blue-500" />
               </div>
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center space-x-4 text-gold">
                     <ShieldCheck className="w-6 h-6" />
                     <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest">The Global Dispatch Charter</h3>
                  </div>
                  <p className="text-xl font-light italic leading-relaxed opacity-80 max-w-2xl">
                    "Institutional dispatch requires more than transit; it requires absolute custody. Every artifact leaving the Maison hubs is verified against the 1924 provenance registry."
                  </p>
                  <div className="pt-6 border-t border-white/10 flex gap-12">
                     <PolicyLine label="Transit Insurance" val="Absolute Replacement" />
                     <PolicyLine label="Dispatch Audit" val="12-Point Check" />
                     <PolicyLine label="Chain of Custody" val="Immutable" />
                  </div>
               </div>
            </Card>
         </div>
         <aside className="lg:col-span-4 space-y-8">
            <Card className="bg-[#111113] border-white/5 p-8 space-y-6 rounded-none">
               <div className="flex items-center space-x-3 text-red-500/60">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Reverse Logistics Alert</h4>
               </div>
               <p className="text-[10px] text-white/40 italic leading-relaxed">
                 "Three failed delivery attempts in the Mumbai hub. Autonomous return-to-origin protocol pending authorization."
               </p>
               <Button variant="outline" className="w-full border-red-900/40 text-red-500 h-10 rounded-none text-[8px] font-bold uppercase hover:bg-red-600 hover:text-white transition-all">
                  AUTHORIZE RETURN
               </Button>
            </Card>
         </aside>
      </div>
    </div>
  );
}

function LogisticsStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-2 rounded-none hover:border-blue-500/40 transition-all">
       <p className="text-[8px] font-bold uppercase tracking-widest text-white/20">{label}</p>
       <p className={cn("text-3xl font-headline font-bold italic tabular", color)}>{value}</p>
    </Card>
  );
}

function PolicyLine({ label, val }: { label: string, val: string }) {
  return (
    <div className="space-y-1">
       <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">{label}</p>
       <p className="text-[10px] font-bold text-white/80">{val}</p>
    </div>
  );
}
