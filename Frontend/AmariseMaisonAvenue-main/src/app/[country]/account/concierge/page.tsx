'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  LifeBuoy, 
  ChevronRight, 
  Plus, 
  Search, 
  Clock, 
  MessageSquare, 
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ConciergeTicketsPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { supportTickets, currentUser } = useAppStore();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Concierge Request Registered",
      description: "A Maison care specialist will review your inquiry within 2 business hours.",
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Concierge Assistance</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Concierge</h1>
          <p className="text-sm text-gray-500 font-light italic">Institutional care and artisanal support for your collection.</p>
        </div>
        <Button 
          className="h-14 px-10 rounded-none bg-plum text-white hover:bg-black transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-plum/20"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          {isFormOpen ? <X className="w-4 h-4 mr-3" /> : <Plus className="w-4 h-4 mr-3" />}
          {isFormOpen ? 'CLOSE FORM' : 'NEW ASSISTANCE REQUEST'}
        </Button>
      </header>

      {isFormOpen && (
        <Card className="bg-white border-plum shadow-2xl p-12 space-y-10 animate-fade-in relative overflow-hidden rounded-none">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><LifeBuoy className="w-40 h-40" /></div>
           <div className="space-y-4">
              <h2 className="text-3xl font-headline font-bold italic">Speake with the Ateliers</h2>
              <p className="text-sm text-gray-500 font-light italic max-w-xl">
                "Our specialists are available for provenance inquiries, restoration logistics, and authentication certificates."
              </p>
           </div>

           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Inquiry Subject</Label>
                    <Input required className="rounded-none border-slate-200 h-12 text-sm italic font-light" placeholder="e.g., Provenance request for 1924 series..." />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Service Category</Label>
                    <Select defaultValue="Product Query">
                       <SelectTrigger className="rounded-none border-slate-200 h-12">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-white border-border shadow-luxury">
                          <SelectItem value="Order Issue" className="text-xs">Order Assistance</SelectItem>
                          <SelectItem value="Product Query" className="text-xs">Provenance Inquiry</SelectItem>
                          <SelectItem value="Return/Exchange" className="text-xs">Restoration Logistics</SelectItem>
                          <SelectItem value="VIP Request" className="text-xs">Bespoke Curation</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Detailed Message</Label>
                    <Textarea required className="rounded-none border-slate-200 min-h-[120px] text-xs px-4 py-4 italic font-light" placeholder="Please describe your requirements in detail..." />
                 </div>
                 <div className="pt-4 flex justify-end">
                    <Button type="submit" className="rounded-none bg-black text-white hover:bg-plum h-12 px-12 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl">
                       TRANSMIT REQUEST <Send className="w-3 h-3 ml-3" />
                    </Button>
                 </div>
              </div>
           </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {supportTickets.map(ticket => (
          <Card key={ticket.id} className="bg-white border-border shadow-sm group hover:border-plum transition-all overflow-hidden rounded-none p-8 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center space-x-8 flex-1">
                <div className={cn(
                  "p-4 rounded-full border transition-colors",
                  ticket.status === 'open' ? "bg-red-50 border-red-100 text-red-500" : "bg-green-50 border-green-100 text-green-600"
                )}>
                   {ticket.status === 'open' ? <HelpCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div className="space-y-1 flex-1">
                   <div className="flex items-center space-x-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Request ID: {ticket.id}</span>
                      <Badge className={cn("text-[7px] uppercase tracking-tighter border-none", 
                        ticket.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                      )}>
                        {ticket.priority}
                      </Badge>
                   </div>
                   <h4 className="text-xl font-headline font-bold italic text-gray-900 group-hover:text-plum transition-colors">{ticket.subject}</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{ticket.category} • {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                </div>
             </div>
             
             <div className="flex items-center space-x-12">
                <div className="text-right">
                   <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Resolution Status</p>
                   <p className="text-xs font-bold uppercase tracking-tight text-gray-900">{ticket.status}</p>
                </div>
                <Button variant="ghost" className="h-12 w-12 p-0 text-gray-300 group-hover:text-plum transition-colors">
                   <ChevronRight className="w-6 h-6" />
                </Button>
             </div>
          </Card>
        ))}

        {supportTickets.length === 0 && (
          <div className="py-40 text-center opacity-30">
             <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
             <p className="text-sm font-bold uppercase tracking-widest italic">All curatorial care items are currently resolved.</p>
          </div>
        )}
      </div>
    </div>
  );
}
