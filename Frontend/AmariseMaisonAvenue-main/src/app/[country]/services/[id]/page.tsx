'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MAISON_SERVICES } from '@/lib/mock-monetization';
import { Button } from '@/components/ui/button';
import { InquiryModal } from '@/components/product/InquiryModal';
import { ShieldCheck, ArrowRight, Star, Globe, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ServicePage() {
  const { id, country } = useParams();
  const service = MAISON_SERVICES.find(s => s.id === id);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  if (!service) return <div className="py-40 text-center font-headline text-3xl">Service not found.</div>;

  return (
    <div className="bg-ivory pb-40">
      <InquiryModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        service={service} 
      />

      {/* Hero Header */}
      <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden bg-black text-white">
        <Image 
          src={service.imageUrl} 
          alt={service.name} 
          fill 
          className="object-cover opacity-40 grayscale-[50%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        <div className="relative z-10 text-center space-y-8 max-w-5xl px-12">
          <span className="text-secondary text-xs font-bold tracking-[0.6em] uppercase px-6 py-2 border border-secondary/30 bg-black/40 luxury-blur">
            Maison Elite Services
          </span>
          <h1 className="text-7xl md:text-[120px] font-headline font-bold italic leading-none tracking-tighter">
            {service.name}
          </h1>
          <p className="text-2xl md:text-3xl font-light italic max-w-3xl mx-auto leading-relaxed opacity-90">
            {service.tagline}
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="container mx-auto px-12 py-40 grid grid-cols-1 lg:grid-cols-12 gap-32 items-center max-w-[1600px]">
        <div className="lg:col-span-7 space-y-12">
          <div className="space-y-6">
            <h2 className="text-5xl font-headline font-bold italic text-gray-900 leading-tight">
              An Elevated standard <br /> of guidance.
            </h2>
            <div className="h-px w-24 bg-plum" />
          </div>
          <p className="text-2xl text-gray-600 font-light italic leading-relaxed first-letter:text-8xl first-letter:font-headline first-letter:text-black first-letter:float-left first-letter:mr-6 first-letter:mt-4">
            {service.description}
          </p>
          <div className="pt-8">
            <Button 
              className="h-20 px-16 bg-black text-white hover:bg-gold hover:text-black rounded-none text-[11px] font-bold tracking-[0.5em] uppercase shadow-2xl transition-all"
              onClick={() => setIsInquiryOpen(true)}
            >
              INQUIRE FOR PRIVATE SERVICE <ArrowRight className="ml-4 w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-12">
          <div className="bg-white p-12 border border-border shadow-luxury space-y-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Sparkles className="w-64 h-64 text-black" />
             </div>
             <div className="relative z-10 space-y-8">
                <h3 className="text-[10px] font-bold tracking-[0.5em] uppercase text-secondary">Service Highlights</h3>
                <div className="space-y-8">
                  {service.features.map((f, i) => (
                    <div key={i} className="flex items-start space-x-6 group">
                       <div className="mt-1"><ShieldCheck className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" /></div>
                       <p className="text-xl font-light italic text-gray-800">{f}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pricing Model</span>
                   <span className="text-sm font-bold uppercase text-plum">{service.priceRange}</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Trust Signifiers */}
      <section className="container mx-auto px-12 py-24 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-16 max-w-[1600px]">
         <TrustItem icon={<Globe className="w-8 h-8" />} title="Global Presence" desc="Available across all five international Maison hubs." />
         <TrustItem icon={<ShieldCheck className="w-8 h-8" />} title="Discreet Sourcing" desc="Absolute privacy maintained for all high-value acquisitions." />
         <TrustItem icon={<Clock className="w-8 h-8" />} title="Institutional Response" desc="24-business hour response for VIP service requests." />
      </section>
    </div>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center p-6 bg-white rounded-full shadow-sm text-plum mb-4">
        {icon}
      </div>
      <h4 className="text-xl font-headline font-bold italic uppercase tracking-widest">{title}</h4>
      <p className="text-sm text-gray-500 font-light italic leading-relaxed px-8">{desc}</p>
    </div>
  );
}
