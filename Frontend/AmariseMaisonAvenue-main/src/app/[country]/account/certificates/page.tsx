'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { 
  ShieldCheck, 
  ChevronRight, 
  Download, 
  Award, 
  Search, 
  Eye,
  Lock,
  History,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * Heritage Archive: Digital Certificate Registry.
 * High-trust environment for managing artisanal authentication documentation.
 */
export default function HeritageArchivePage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { activeVip } = useAppStore();

  const certificates = activeVip?.certificates || [];

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Heritage Archive</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Certificates</h1>
          <p className="text-sm text-gray-500 font-light italic">Institutional authentication and provenance records for your collection.</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input className="bg-white border border-border h-10 pl-10 pr-4 text-[9px] font-bold uppercase tracking-widest outline-none w-48 focus:ring-1 focus:ring-plum transition-all" placeholder="FILTER ARCHIVE..." />
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {certificates.map((cert) => (
          <Card key={cert.id} className="bg-white border-border shadow-luxury group hover:border-plum transition-all overflow-hidden flex flex-col">
            <div className="aspect-[4/5] relative bg-muted overflow-hidden">
               <Image src={cert.imageUrl} alt={cert.artifactName} fill className="object-contain p-8 group-hover:scale-105 transition-transform duration-[2s]" />
               <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
               <div className="absolute top-6 right-6">
                  <div className="bg-white/90 backdrop-blur-md p-3 border border-gray-100 shadow-xl rounded-full">
                     <ShieldCheck className="w-5 h-5 text-secondary" />
                  </div>
               </div>
            </div>
            
            <div className="p-8 space-y-6 flex-1 flex flex-col">
               <div className="space-y-2 flex-1">
                  <div className="flex justify-between items-start">
                     <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-plum/20 text-plum px-3 py-1">
                        {cert.status}
                     </Badge>
                     <span className="text-[8px] text-gray-400 font-mono uppercase">ID: {cert.id}</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold italic text-gray-900">{cert.artifactName}</h3>
                  <div className="flex items-center space-x-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                     <Award className="w-3 h-3 text-gold" />
                     <span>Provenance Score: {cert.provenanceScore}%</span>
                  </div>
               </div>

               <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-10 border-border text-[9px] font-bold uppercase tracking-widest hover:bg-ivory">
                     <Eye className="w-3.5 h-3.5 mr-2" /> VIEW DOCS
                  </Button>
                  <Button className="h-10 bg-black text-white hover:bg-plum text-[9px] font-bold uppercase tracking-widest">
                     <Download className="w-3.5 h-3.5 mr-2" /> PDF EXPORT
                  </Button>
               </div>
            </div>
          </Card>
        ))}

        {certificates.length === 0 && (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-border flex flex-col items-center space-y-6 opacity-30 rounded-sm">
             <div className="p-8 bg-ivory border border-border rounded-full">
                <FileText className="w-12 h-12 text-gray-200" />
             </div>
             <div className="space-y-2">
                <p className="text-xl font-headline font-bold italic text-gray-900">Archive Currently Empty</p>
                <p className="text-xs text-gray-500 font-light uppercase tracking-widest">Authenticated artifacts will appear here post-acquisition.</p>
             </div>
          </div>
        )}
      </div>

      {/* Security Advisory */}
      <section className="bg-black text-white p-12 relative overflow-hidden rounded-none shadow-2xl">
         <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Lock className="w-40 h-40" /></div>
         <div className="relative z-10 flex flex-col md:row items-center justify-between gap-12 text-center md:text-left">
            <div className="space-y-4 max-w-2xl">
               <div className="flex items-center space-x-3 text-gold">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Immutable Provenance Protocol</span>
               </div>
               <h3 className="text-3xl font-headline font-bold italic">Protect your heritage.</h3>
               <p className="text-sm font-light italic opacity-60 leading-relaxed">
                 "Every digital certificate in your archive is backed by the Maison's physical archival registry. These documents serve as the primary legal proof of artisanal authenticity for future transfers or insurance appraisals."
               </p>
            </div>
            <Link href={`/${countryCode}/contact`}>
               <Button className="h-16 px-12 bg-white text-black hover:bg-gold rounded-none text-[10px] font-bold tracking-[0.3em] uppercase transition-all shadow-xl">
                  CONSULT ARCHIVIST
               </Button>
            </Link>
         </div>
      </section>
    </div>
  );
}
