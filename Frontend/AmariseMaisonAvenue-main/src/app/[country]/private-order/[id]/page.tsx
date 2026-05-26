'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PRODUCTS, formatPrice, COUNTRIES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  ChevronRight, 
  Lock, 
  Crown, 
  Globe, 
  ArrowRight,
  Star
} from 'lucide-react';
import { useSalesSystem } from '@/hooks/use-sales-system';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Private Client Experience (Design B: The Private Salon).
 * Optimized for high-value acquisition and Elite SEO authority.
 */
export default function PrivateOrderPage() {
  const { id, country } = useParams();
  const countryCode = (country as string) || 'us';
  const product = useMemo(() => PRODUCTS.find(p => p.id === id), [id]);
  const { createInitialInquiry } = useSalesSystem();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  if (!product) {
    return <div className="py-40 text-center font-headline text-3xl text-gray-900">Artifact not found in registry.</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inquiryId = createInitialInquiry({
      productId: product.id,
      customerName: formData.name,
      email: formData.email,
      country: countryCode,
      budgetRange: 'Tier 1',
      intent: 'Collector',
      message: formData.message,
      contactMethod: 'WhatsApp',
      brandId: 'amarise-luxe'
    });

    toast({
      title: "Acquisition Protocol Initialized",
      description: "A specialist curator is reviewing your brief.",
    });

    setTimeout(() => {
      router.push(`/${countryCode}/inquiry/${inquiryId}`);
    }, 1500);
  };

  return (
    <div className="bg-ivory min-h-screen pb-40">
      {/* SEO Structured Data: Elite Product Offering */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": [product.imageUrl],
            "description": `Private acquisition brief for the rare ${product.name} artifact. Restricted to the Maison Private Salon.`,
            "sku": product.id,
            "brand": { "@type": "Brand", "name": "AMARISÉ MAISON AVENUE" },
            "offers": {
              "@type": "Offer",
              "availability": "https://schema.org/LimitedAvailability",
              "priceCurrency": COUNTRIES[countryCode]?.currency || "USD",
              "price": product.basePrice
            }
          })
        }}
      />

      {/* Cinematic Hero Header */}
      <section className="relative h-[55vh] w-full flex items-center justify-center overflow-hidden border-b border-border">
        <Image 
          src="https://picsum.photos/seed/amarise-private/2560/1440" 
          alt="Maison Private Salon Exclusive Environment" 
          fill 
          className="object-cover opacity-40 grayscale-[50%]" 
          priority
          data-ai-hint="exclusive interior"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ivory/20 to-ivory" />
        <div className="relative z-10 text-center space-y-6 px-6">
          <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-[0.5em] uppercase text-gray-400 mb-8 font-bold">
            <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-plum">Private Acquisition Flow</span>
          </nav>
          <span className="text-plum text-[10px] font-bold tracking-[0.6em] uppercase">Maison Private Salon</span>
          <h1 className="text-6xl md:text-[100px] font-headline font-bold italic text-gray-900 leading-tight tracking-tighter">
            The {product.name}
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-6 mt-24 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-24 items-start">
          
          {/* Left Narrative Column */}
          <div className="lg:w-3/5 space-y-16">
            <div className="relative aspect-[4/5] bg-white border border-border shadow-luxury group overflow-hidden">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill 
                className="object-contain p-12 transition-transform duration-[3s] group-hover:scale-105" 
              />
              <div className="absolute top-8 left-8">
                <div className="bg-black/90 backdrop-blur-md px-6 py-2 border border-white/10 shadow-2xl">
                   <span className="text-[10px] font-bold tracking-[0.4em] text-white uppercase italic">Archive Ref: {product.id.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="narrative" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-14 p-0 space-x-12">
                <TabsTrigger value="narrative" className="tab-trigger text-[11px] font-bold uppercase tracking-widest data-[state=active]:text-plum data-[state=active]:border-plum">The Narrative</TabsTrigger>
                <TabsTrigger value="provenance" className="tab-trigger text-[11px] font-bold uppercase tracking-widest data-[state=active]:text-plum data-[state=active]:border-plum">Provenance</TabsTrigger>
              </TabsList>
              <TabsContent value="narrative" className="pt-12">
                <p className="text-gray-600 font-light leading-[1.8] text-2xl italic first-letter:text-9xl first-letter:font-headline first-letter:text-gray-900 first-letter:float-left first-letter:mr-6 first-letter:mt-4">
                  {product.specialNotes || "This artifact represents the absolute pinnacle of the Maison's craftsmanship. Hand-finished in our central atelier, it serves as a testament to human brilliance and the pursuit of the absolute standard. Every stitch and material selection has been audited for heritage compliance, ensuring its position as a primary pillar of any elite collection."}
                </p>
              </TabsContent>
              <TabsContent value="provenance" className="pt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-plum">Origin Archive</h4>
                      <p className="text-lg font-light italic text-gray-500 leading-relaxed">Maison Central Ateliers, Heritage Series v1.2. Audited provenance records included.</p>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-plum">Security Matrix</h4>
                      <p className="text-lg font-light italic text-gray-500 leading-relaxed">NFC Authenticity Certification and Secure Digital Ledger Tracking.</p>
                   </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Action Column */}
          <aside className="lg:w-2/5 space-y-12 lg:sticky lg:top-40">
            <div className="space-y-6 pb-12 border-b border-border">
              <div className="flex items-center space-x-3 text-gold">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Private Allocation</span>
              </div>
              <h2 className="text-4xl font-headline font-bold italic text-gray-900 leading-tight">{product.name}</h2>
              <div className="flex items-center space-x-6">
                <div className="text-5xl font-light tracking-tighter text-gray-900 tabular-nums">{formatPrice(product.basePrice, countryCode)}</div>
                <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-plum/20 text-plum px-3 py-1">Inquire Only</Badge>
              </div>
            </div>

            <div className="bg-white p-10 border border-border shadow-luxury space-y-10">
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Initiate Acquisition Brief</h3>
                <p className="text-[11px] text-gray-400 italic">Discreet curatorial review required for this artifact.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Full Legal Name</Label>
                  <Input required className="rounded-none border-border bg-ivory/30 h-14 text-sm italic focus:border-plum" placeholder="Julian Vandervilt" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Private Correspondence Email</Label>
                  <Input required type="email" className="rounded-none border-border bg-ivory/30 h-14 text-sm italic focus:border-plum" placeholder="j.vandervilt@luxury.net" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Strategic Brief</Label>
                  <Textarea className="rounded-none border-border bg-ivory/30 min-h-[120px] text-sm italic py-4 focus:border-plum" placeholder="Detail your collection intent or specific provenance requirements..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                </div>
                
                <Button type="submit" className="w-full h-20 bg-plum text-white hover:bg-gold hover:text-gray-900 rounded-none text-[10px] font-bold tracking-[0.4em] uppercase shadow-2xl transition-all">
                  TRANSMIT PRIVATE BRIEF <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </form>

              <div className="pt-6 border-t border-border space-y-6">
                <BenefitRow icon={<ShieldCheck className="w-4 h-4 text-gold" />} text="Institutional Responsibility Protocol" />
                <BenefitRow icon={<Globe className="w-4 h-4 text-gold" />} text="Global White-Glove Dispatch" />
                <BenefitRow icon={<Lock className="w-4 h-4 text-gold" />} text="Secured Private Client Network" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function BenefitRow({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center space-x-4 opacity-60">
      <div className="shrink-0">{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">{text}</span>
    </div>
  );
}
