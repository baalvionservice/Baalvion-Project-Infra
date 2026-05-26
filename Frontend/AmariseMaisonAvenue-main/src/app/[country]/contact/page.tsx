import React from 'react';
import { Metadata } from 'next';
import { COUNTRIES } from '@/lib/mock-data';
import { ContactFormClient, GlobalAtelier } from './contact-form-client';
import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Sparkles,
  Globe,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ContactPageProps = {
  params: {
    country: string;
  };
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const countryCode = (params.country as string) || 'us';
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;
  return {
    title: `Contact AMARISÉ MAISON | Concierge Services in ${currentCountry.office?.city}`,
    description: 'Reach out to our private client concierge team for bespoke requests, appointments, and inquiries. Available worldwide.',
  };
}

export default function ContactPage({ params }: ContactPageProps) {
  const countryCode = (params.country as string) || 'us';
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;

  return (
    <div className="animate-fade-in bg-ivory pb-32">
      {/* Hero Header */}
      <section className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-border bg-muted">
        {/* Concierge Card Box Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <span className="text-[10vw] font-headline font-bold text-gray-900 uppercase tracking-widest">CONCIERGE</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ivory/20 to-ivory" />
        <div className="relative z-10 text-center space-y-4 px-6">
          <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-8">
            <Link href={`/${countryCode}`} className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-bold">Concierge</span>
          </nav>
          <span className="text-primary text-[10px] font-bold tracking-[0.5em] uppercase">Private Client Relations</span>
          <h1 className="text-6xl md:text-7xl font-headline font-bold italic text-gray-900 leading-tight">
            The Global Ateliers
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-6 mt-20">
        <div className="flex flex-col lg:flex-row gap-24 items-start">

          {/* Contact Form Section */}
          <ContactFormClient countryCode={countryCode} currentCountry={currentCountry} />


        </div>
      </div>


      {/* Global Ateliers Section */}
      <section className="container mx-auto px-6 mt-40">
        <div className="text-center space-y-4 mb-20">
          <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-plum">Maison Global Network</h3>
          <h2 className="text-5xl font-headline font-bold italic text-gray-900">World-Class Presence</h2>
        </div>
        <GlobalAtelier countryCode={countryCode} />
      </section>
    </div>
  );
}
