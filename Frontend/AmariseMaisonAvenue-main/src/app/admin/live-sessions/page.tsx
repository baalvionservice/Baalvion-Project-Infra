'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Video, 
  ShieldCheck, 
  ChevronRight, 
  RefreshCcw,
  Users,
  Clock,
  Play,
  ArrowRight,
  Info,
  Mic,
  Camera,
  Settings,
  MoreVertical,
  XCircle,
  Eye,
  Lock,
  Search,
  MessageSquare,
  Zap,
  Crown
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

/**
 * Live Control Room: The Curator's Command Center.
 * Conduct and monitor live artifact viewings across global hubs.
 */
export default function LiveControlRoom() {
  const { scopedLiveRequests, currentUser } = useAppStore();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = scopedLiveRequests.find(r => r.id === activeSessionId);

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-plum">
             <Video className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Curatorial Control</span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase">Control Room</h1>
          <p className="text-sm text-white/40 font-light italic">Conduct high-fidelity viewing sessions for elite collectors.</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex flex-col items-end mr-4">
              <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20">System Status</span>
              <div className="flex items-center space-x-2 mt-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">4K Feed Stable</span>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Request Queue */}
        <div className="lg:col-span-7 space-y-12">
           <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
              <CardHeader className="border-b border-white/5 bg-white/5">
                 <CardTitle className="font-headline text-2xl text-white">Viewing Queue</CardTitle>
                 <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Pending and active session requests</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Connoisseur</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Artifact</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Scheduled</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-center text-white/40">Status</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedLiveRequests.map(req => (
                    <TableRow key={req.id} className={cn("hover:bg-white/5 transition-colors border-white/5", activeSessionId === req.id && "bg-plum/5")}>
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-white/80 uppercase">{(req as any).clientName}</span>
                           <span className="text-[8px] text-white/20 uppercase tracking-tighter">{(req as any).country.toUpperCase()} HUB</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-white/40 italic font-light">{req.productName}</TableCell>
                      <TableCell className="text-[9px] font-mono text-white/30">{req.scheduledAt ? new Date(req.scheduledAt).toLocaleString() : 'TBD'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("text-[7px] uppercase border-none", req.status === 'active' ? "bg-emerald-500/10 text-emerald-400 animate-pulse" : "bg-white/10 text-white/40")}>{req.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button size="sm" className="h-8 bg-white text-black hover:bg-plum hover:text-white rounded-none text-[8px] font-bold uppercase tracking-widest" onClick={() => setActiveSessionId(req.id)}>
                           {req.status === 'active' ? 'JOIN SESSION' : 'AUTHORIZE'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {scopedLiveRequests.length === 0 && (
                    <TableRow>
                       <TableCell colSpan={5} className="py-40 text-center opacity-20">
                          <Video className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">No active Viewing Requests</p>
                       </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
           </Card>
        </div>

        {/* Curator Viewport Overlay (Simulated) */}
        <aside className="lg:col-span-5 space-y-12">
           {activeSession ? (
             <div className="space-y-8">
                <Card className="bg-black border-white/10 shadow-2xl overflow-hidden rounded-none">
                   <div className="aspect-video relative bg-zinc-900 flex items-center justify-center group">
                      <div className="text-[10px] font-bold uppercase tracking-[0.8em] text-white/10 animate-pulse">4K FEED: {activeSession.productName.toUpperCase()}</div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      
                      <div className="absolute top-6 left-6 flex items-center space-x-2">
                         <Badge className="bg-red-600 text-white border-none text-[8px] uppercase animate-pulse">LIVE</Badge>
                         <span className="text-[10px] font-bold text-white/60 tracking-widest">CAM_01_MACRO</span>
                      </div>

                      <div className="absolute bottom-6 right-6 flex space-x-3">
                         <CuratorControlBtn icon={<Mic className="w-4 h-4" />} />
                         <CuratorControlBtn icon={<Camera className="w-4 h-4" />} />
                         <CuratorControlBtn icon={<Settings className="w-4 h-4" />} />
                      </div>
                   </div>
                   <div className="p-8 bg-zinc-950 border-t border-white/10 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 bg-plum rounded-full flex items-center justify-center font-headline text-lg font-bold italic text-white shadow-md">{(activeSession as any).clientName.charAt(0)}</div>
                         <div className="space-y-0.5">
                            <p className="text-xs font-bold text-white/80">Viewing with {(activeSession as any).clientName}</p>
                            <p className="text-[9px] text-white/20 uppercase tracking-widest italic">Encrypted Connection: SECURE</p>
                         </div>
                      </div>
                      <Button variant="outline" className="border-red-900/40 text-red-500 rounded-none h-10 text-[9px] font-bold uppercase hover:bg-red-600 hover:text-white">TERMINATE SESSION</Button>
                   </div>
                </Card>

                <Card className="bg-[#111113] border-white/5 p-8 space-y-6">
                   <div className="flex items-center space-x-3 text-blue-400">
                      <MessageSquare className="w-4 h-4" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest">Real-time Sentiment</h4>
                   </div>
                   <div className="p-4 bg-white/[0.02] border border-white/5 rounded-none space-y-4">
                      <p className="text-xs font-light italic text-white/60 leading-relaxed">
                        "Client has spent 4 minutes on the Macro view of the hardware. Intent detected as 'Extreme High'. Recommend issuing Heritage Certificate preview."
                      </p>
                      <Button className="w-full h-10 bg-blue-600 text-white rounded-none text-[9px] font-bold uppercase tracking-widest hover:bg-blue-500">PUSH CERTIFICATE PREVIEW</Button>
                   </div>
                </Card>
             </div>
           ) : (
             <div className="h-[500px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-20">
                <div className="p-8 bg-white/5 rounded-full border border-white/10">
                   <Lock className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                   <p className="text-xl font-headline font-bold italic text-white">Viewport Locked</p>
                   <p className="text-xs font-light uppercase tracking-[0.2em] text-white/60">Authorize a session to begin conducts.</p>
                </div>
             </div>
           )}
        </aside>
      </div>
    </div>
  );
}

function CuratorControlBtn({ icon }: { icon: any }) {
  return (
    <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all rounded-none cursor-pointer">
       {icon}
    </button>
  );
}
