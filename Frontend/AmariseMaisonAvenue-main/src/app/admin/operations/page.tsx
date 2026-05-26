'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ChevronRight, 
  RefreshCcw,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  ArrowRight,
  Database,
  History,
  ShieldCheck,
  FlaskConical,
  RotateCcw,
  Store,
  Briefcase,
  AlertTriangle,
  Upload,
  Zap,
  Tag
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/**
 * Operations Hub: The 21st Tactical Node.
 * Closing the 'Physical Inventory Intake' gap and managing reverse logistics.
 */
export default function OperationsHub() {
  const { scopedProducts, scopedReturns, warehouseLogs, performWarehouseIntake, processReturn, activeHub } = useAppStore();
  const { toast } = useToast();
  
  const [intakeData, setIntakeData] = useState({ productId: '', quantity: '1', reason: 'Initial Intake' });

  const handleIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeData.productId) return;
    performWarehouseIntake(intakeData.productId, parseInt(intakeData.quantity), intakeData.reason);
    toast({ title: "Registry Synchronized", description: `${intakeData.quantity} units added to the ${(activeHub || '').toUpperCase()} archive.` });
    setIntakeData({ productId: '', quantity: '1', reason: 'Institutional Sourcing' });
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-plum">
             <Boxes className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Operations Core</span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase">Operational Matrix</h1>
          <p className="text-sm text-white/40 font-light italic">Management of physical artifact registry and reverse logistics.</p>
        </div>
        <div className="flex items-center space-x-4">
           <Badge variant="outline" className="bg-plum/10 text-plum border-plum/20 h-10 px-6 rounded-none text-[10px] font-bold uppercase tracking-widest">
             Node: {(activeHub || '').toUpperCase() || 'GLOBAL'}
           </Badge>
        </div>
      </header>

      <Tabs defaultValue="intake" className="w-full">
        <TabsList className="bg-[#111113] border border-white/5 h-14 w-full justify-start p-1 rounded-none space-x-2 mb-10">
          <TabsTrigger value="intake" className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">Physical Intake</TabsTrigger>
          <TabsTrigger value="returns" className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">Reverse Logistics ({scopedReturns.length})</TabsTrigger>
          <TabsTrigger value="logs" className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">Movement Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="animate-fade-in">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7">
                 <Card className="bg-[#111113] border-white/5 shadow-2xl rounded-none">
                    <CardHeader className="border-b border-white/5 bg-white/5 p-8">
                       <div className="flex items-center space-x-4">
                          <Upload className="w-6 h-6 text-plum" />
                          <div>
                             <CardTitle className="text-white font-headline text-2xl uppercase">Artifact Registry Intake</CardTitle>
                             <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Official registration of physical assets arriving at hub</CardDescription>
                          </div>
                       </div>
                    </CardHeader>
                    <form onSubmit={handleIntake} className="p-10 space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <Label className="text-[9px] uppercase font-bold tracking-widest text-white/40">Artifact Ref (SKU)</Label>
                             <select 
                              className="w-full bg-white/5 border border-white/10 h-14 px-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-plum"
                              value={intakeData.productId}
                              onChange={e => setIntakeData({...intakeData, productId: e.target.value})}
                             >
                                <option value="" className="bg-[#111113]">Select Artifact...</option>
                                {scopedProducts.map(p => (
                                  <option key={p.id} value={p.id} className="bg-[#111113]">{p.name}</option>
                                ))}
                             </select>
                          </div>
                          <div className="space-y-3">
                             <Label className="text-[9px] uppercase font-bold tracking-widest text-white/40">Intake Quantity</Label>
                             <Input 
                              type="number"
                              value={intakeData.quantity}
                              onChange={e => setIntakeData({...intakeData, quantity: e.target.value})}
                              className="bg-white/5 border border-white/10 h-14 text-lg font-bold text-white rounded-none tabular"
                             />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[9px] uppercase font-bold tracking-widest text-white/40">Institutional Rationale</Label>
                          <Input 
                            value={intakeData.reason}
                            onChange={e => setIntakeData({...intakeData, reason: e.target.value})}
                            className="bg-white/5 border border-white/10 h-14 text-sm italic font-light text-white/60 rounded-none"
                            placeholder="e.g., Sourced from private archival auction..."
                          />
                       </div>
                       <Button className="w-full h-16 bg-plum text-white hover:bg-black rounded-none text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-plum/20 transition-all">
                          AUTHORIZE PHYSICAL INTAKE
                       </Button>
                    </form>
                 </Card>
              </div>

              <aside className="lg:col-span-5 space-y-8">
                 <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                       <ShieldCheck className="w-40 h-40 text-plum" />
                    </div>
                    <div className="relative z-10 space-y-6">
                       <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Intake Protocol</h4>
                       <p className="text-sm font-light italic leading-relaxed opacity-70">
                         "Physical assets must be audited for provenance before digital registration. Ensure the 12-point quality check is completed by a senior curator."
                       </p>
                       <div className="space-y-4 pt-4 border-t border-white/10">
                          <IntakeRule label="Visual Audit" />
                          <IntakeRule label="NFC Seal Verification" />
                          <IntakeRule label="Provenance Documentation" />
                       </div>
                    </div>
                 </Card>
              </aside>
           </div>
        </TabsContent>

        <TabsContent value="returns" className="animate-fade-in space-y-8">
           <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
              <Table>
                 <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                       <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Return ID</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Artifact</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Reason</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-center text-white/40">Status</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {scopedReturns.map(req => (
                      <TableRow key={req.id} className="hover:bg-white/5 transition-colors border-white/5 h-20">
                         <TableCell className="pl-8 font-mono text-[10px] text-plum uppercase">{req.id}</TableCell>
                         <TableCell className="text-xs font-bold text-white/80 uppercase">Piece: {req.productId}</TableCell>
                         <TableCell className="text-xs font-light italic text-white/40 truncate max-w-[200px]">"{req.reason}"</TableCell>
                         <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[7px] uppercase border-none px-2", 
                              req.status === 'restocked' ? "bg-emerald-500/10 text-emerald-400" : "bg-gold/10 text-gold"
                            )}>{req.status}</Badge>
                         </TableCell>
                         <TableCell className="text-right pr-8">
                            <div className="flex justify-end space-x-2">
                               {(['received', 'inspected', 'restocked'] as const).map(s => (
                                 <button 
                                  key={s} 
                                  onClick={() => processReturn(req.id, s)}
                                  className={cn(
                                    "px-3 py-1 text-[7px] font-bold uppercase tracking-widest border transition-all",
                                    req.status === s ? "bg-white text-black" : "border-white/10 text-white/20 hover:text-white"
                                  )}
                                 >
                                   {s}
                                 </button>
                               ))}
                            </div>
                         </TableCell>
                      </TableRow>
                    ))}
                    {scopedReturns.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={5} className="py-40 text-center opacity-20">
                            <RotateCcw className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No Active Return Requests</p>
                         </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="logs" className="animate-fade-in space-y-8">
           <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
              <Table>
                 <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                       <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Timestamp</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Type</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Delta</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-white/40">Rationale</TableHead>
                       <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Actor</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {warehouseLogs.map(log => (
                      <TableRow key={log.id} className="hover:bg-white/5 transition-colors border-white/5 h-12">
                         <TableCell className="pl-8 text-[10px] font-mono text-white/20">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                         <TableCell><Badge variant="outline" className="text-[7px] uppercase border-white/10 text-white/40">{log.type}</Badge></TableCell>
                         <TableCell className="text-xs font-bold text-white/80">+{log.quantity} Units</TableCell>
                         <TableCell className="text-xs font-light italic text-white/40">"{log.reason}"</TableCell>
                         <TableCell className="text-right pr-8 font-bold text-[9px] uppercase text-plum">{log.actorName}</TableCell>
                      </TableRow>
                    ))}
                    {warehouseLogs.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={5} className="py-40 text-center opacity-20">
                            <History size={48} className="mx-auto mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No movement history recorded</p>
                         </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IntakeRule({ label }: { label: string }) {
  return (
    <div className="flex items-center space-x-3 group">
       <div className="w-4 h-4 border border-gold rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
       </div>
       <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{label}</span>
    </div>
  );
}
