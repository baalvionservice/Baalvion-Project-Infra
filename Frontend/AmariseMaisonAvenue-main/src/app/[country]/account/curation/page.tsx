'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { 
  MessageSquare, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Lock,
  Crown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function CurationInquiriesPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { privateInquiries } = useAppStore();

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Curatorial Dialogues</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Curation</h1>
          <p className="text-sm text-gray-500 font-light italic">Manage your active acquisition briefs and bespoke requests.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {privateInquiries.map((inquiry) => (
          <Card key={inquiry.id} className="bg-white border-border shadow-luxury group hover:border-plum transition-all overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 bg-ivory p-8 flex flex-col justify-center items-center text-center space-y-4 border-r border-border">
                 <div className="w-16 h-16 bg-white border border-border rounded-full flex items-center justify-center font-headline text-2xl font-bold italic text-plum shadow-sm">
                    {inquiry.country.charAt(0)}
                 </div>
                 <div>
                    <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-plum/20 text-plum px-3 py-1">
                       {inquiry.status}
                    </Badge>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2">{inquiry.country} HUB</p>
                 </div>
              </div>
              
              <div className="flex-1 p-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-headline font-bold italic text-gray-900 leading-tight">
                      {inquiry.productId ? `Archive Brief: ${inquiry.productId.toUpperCase()}` : 'General Bespoke Commission'}
                    </h3>
                    <div className="flex items-center space-x-3">
                       <Clock className="w-3 h-3 text-gray-300" />
                       <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Updated {new Date(inquiry.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Crown className={cn("w-5 h-5", inquiry.leadTier === 1 ? "text-gold fill-gold" : "text-gray-100")} />
                </div>

                <p className="text-sm text-gray-600 font-light italic leading-relaxed line-clamp-2">
                  "{inquiry.message || "Initializing strategic brief for private allocation..."}"
                </p>

                <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div className="flex items-center space-x-6 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      <div className="flex items-center space-x-2">
                         <ShieldCheck className="w-3 h-3 text-secondary" />
                         <span>Provenance Audited</span>
                      </div>
                      <div className="flex items-center space-x-2">
                         <Lock className="w-3 h-3 text-secondary" />
                         <span>End-to-End Secure</span>
                      </div>
                   </div>
                   <Link href={`/${countryCode}/inquiry/${inquiry.id}`}>
                      <Button className="h-12 px-10 rounded-none bg-black text-white hover:bg-plum transition-all text-[9px] font-bold uppercase tracking-widest shadow-xl">
                         RESUME DIALOGUE <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                   </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {privateInquiries.length === 0 && (
          <div className="py-40 text-center border-2 border-dashed border-border flex flex-col items-center space-y-6 opacity-30">
             <div className="p-8 bg-ivory border border-border rounded-full">
                <Sparkles className="w-12 h-12 text-gold/30" />
             </div>
             <div className="space-y-2">
                <p className="text-xl font-headline font-bold italic text-gray-900">No Active Curation</p>
                <p className="text-xs text-gray-500 font-light uppercase tracking-widest">Your curatorial dialogues will appear here.</p>
             </div>
             <Link href={`/${countryCode}/appointments`}>
                <Button variant="outline" className="h-12 border-plum text-plum rounded-none text-[9px] font-bold tracking-widest uppercase px-12">BOOK A SESSION</Button>
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
