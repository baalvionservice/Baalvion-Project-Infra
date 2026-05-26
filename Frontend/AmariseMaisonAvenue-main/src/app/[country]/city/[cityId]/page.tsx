"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CITIES, COUNTRIES, PRODUCTS, COLLECTIONS } from "@/lib/mock-data";
import { generateCityNarrative } from "@/ai/flows/generate-city-narrative";
import { ProductCard } from "@/components/product/ProductCard";
import {
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Globe,
  ArrowRight,
  Store,
  Compass,
  History,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * CityPage: Programmatic SEO Authority Page.
 * Focuses on high-authority city-specific luxury content and local structured data.
 */
export default function CityPage() {
  const { country, cityId } = useParams();
  const countryCode = (country as string) || "us";
  const city = CITIES.find((c) => c.id === cityId);
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;

  const [narrative, setNarrative] = useState<string | null>(null);
  const [loadingNarrative, setLoadingNarrative] = useState(true);

  const featuredProducts = PRODUCTS.filter((p) =>
    city?.featuredProducts.includes(p.id)
  );
  const featuredCollections = COLLECTIONS.filter((c) =>
    city?.featuredCollections.includes(c.id)
  );

  useEffect(() => {
    if (!city) return;
    async function fetchNarrative() {
      setLoadingNarrative(true);
      try {
        const res = await generateCityNarrative({
          cityName: city?.name || "",
          country: currentCountry.name,
        });
        setNarrative(res.narrative);
      } catch (e) {
        setNarrative(null);
      } finally {
        setLoadingNarrative(false);
      }
    }
    fetchNarrative();
  }, [city, currentCountry.name]);

  if (!city)
    return (
      <div className="py-40 text-center font-headline text-3xl">
        Destination not found in global network.
      </div>
    );

  return (
    <div className="animate-fade-in bg-ivory pb-40">
      {/* SEO Schema: City Authority & Local Business Intelligence */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Guide",
            name: `Luxury Shopping in ${city.name} | Amarisé Maison`,
            description: city.description,
            abstract: narrative,
            mainEntity: {
              "@type": "LocalBusiness",
              name: `Amarisé Maison Avenue ${city.name}`,
              address: {
                "@type": "PostalAddress",
                streetAddress: city.office.address,
                addressLocality: city.name,
              },
              telephone: city.office.phone,
            },
            hasPart: featuredProducts.map((p) => ({
              "@type": "Product",
              name: p.name,
            })),
          }),
        }}
      />

      {/* Hero Header */}
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden bg-muted">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <span className="text-[25vw] font-headline font-bold text-gray-900 italic tracking-tighter leading-none">
            {city.name.charAt(0)}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-ivory" />
        <div className="relative z-10 text-center space-y-12 max-w-6xl px-12">
          <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-[0.5em] uppercase text-muted-foreground mb-12 font-bold">
            <Link
              href={`/${countryCode}`}
              className="hover:text-primary transition-colors"
            >
              Maison
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Global Destinations</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-secondary font-black">{city.name}</span>
          </nav>
          <div className="space-y-6">
            <span className="text-secondary text-xs font-bold tracking-[0.6em] uppercase">
              The Global Ateliers
            </span>
            <h1 className="text-8xl md:text-[160px] font-headline font-bold text-gray-900 leading-[0.8] italic tracking-tighter">
              {city.name}
            </h1>
          </div>
          <p className="text-2xl md:text-3xl text-gray-600 font-light italic max-w-4xl mx-auto leading-relaxed">
            {city.description}
          </p>
        </div>
      </section>

      {/* Editorial Authority Pillar */}
      <section className="container mx-auto px-12 py-40 max-w-[1600px]">
        <div className="max-w-5xl mx-auto space-y-24">
          <div className="flex items-center space-x-8 text-secondary/30">
            <div className="h-px flex-1 bg-current" />
            <Compass className="w-8 h-8" />
            <div className="h-px flex-1 bg-current" />
          </div>

          <div className="bg-white p-24 border border-border shadow-luxury relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 p-24 opacity-5 pointer-events-none">
              <Globe className="w-96 h-96 text-black" />
            </div>
            {loadingNarrative ? (
              <div className="space-y-8 animate-pulse">
                <div className="h-8 bg-muted w-full" />
                <div className="h-8 bg-muted w-5/6 mx-auto" />
                <div className="h-8 bg-muted w-4/6 mx-auto" />
              </div>
            ) : (
              <div className="space-y-12 relative z-10 text-center">
                <div className="space-y-2">
                  <h2 className="text-[10px] font-bold tracking-[0.6em] uppercase text-secondary">
                    Maison Intelligence
                  </h2>
                  <h3 className="text-4xl font-headline font-bold italic tracking-tight">
                    The {city.name} Perspective
                  </h3>
                </div>
                <p className="text-4xl text-gray-800 font-light italic font-headline leading-snug max-w-4xl mx-auto">
                  {narrative}
                </p>
                <div className="h-px w-32 bg-secondary mx-auto" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Local Trends & Curated Edits */}
      <section className="container mx-auto px-12 py-24 space-y-48 max-w-[1600px]">
        <div className="space-y-24">
          <div className="flex flex-col items-center text-center space-y-4">
            <History className="w-10 h-10 text-secondary" />
            <h2 className="text-6xl font-headline font-bold italic text-gray-900 tracking-tight">
              Local Resonance
            </h2>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.5em] font-bold">
              Atelier Trends: {city.name}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {city.trends.map((trend, idx) => (
              <div
                key={idx}
                className="bg-white p-16 border border-border shadow-sm group hover:border-plum hover:shadow-luxury transition-all duration-700"
              >
                <h4 className="text-3xl font-headline font-bold italic text-gray-900 mb-6 group-hover:text-plum transition-colors tracking-tight">
                  {trend.title}
                </h4>
                <p className="text-xl text-gray-500 font-light leading-relaxed italic border-l-2 border-plum/20 pl-8">
                  {trend.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-24">
          <div className="flex items-end justify-between border-b border-gray-100 pb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-secondary">
                <Sparkles className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-[0.5em]">
                  Curated Edits
                </span>
              </div>
              <h2 className="text-5xl font-headline font-bold italic text-gray-900 leading-none">
                City-Specific Selection
              </h2>
            </div>
            <Link
              href={`/${countryCode}/category/apparel`}
              className="text-[10px] font-bold tracking-[0.4em] uppercase text-black hover:text-plum transition-all border-b border-black pb-2 flex items-center"
            >
              Explore Full Archive <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-0 bg-white shadow-2xl border border-gray-100 overflow-hidden">
          <div className="lg:w-1/2 relative min-h-[600px] overflow-hidden group bg-muted">
            <Image
              src="https://picsum.photos/seed/amarise-flagship/1200/1200"
              alt={`${city.name} Flagship Sanctuary`}
              fill
              className="object-cover transition-transform duration-[3s] group-hover:scale-105 opacity-80 grayscale-[20%]"
              data-ai-hint="luxury boutique"
            />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="luxury-blur bg-white/10 border border-white/20 p-12 text-center text-white space-y-4 w-full">
                <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-secondary">
                  Atelier Perspective
                </span>
                <h4 className="text-4xl font-headline font-bold italic">
                  The Archive View
                </h4>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 p-24 lg:p-32 flex flex-col justify-center space-y-12">
            <div className="flex items-center space-x-4 text-secondary">
              <Store className="w-10 h-10" />
              <h3 className="text-[10px] font-bold tracking-[0.6em] uppercase">
                The Flagship Sanctuary
              </h3>
            </div>
            <h2 className="text-6xl font-headline font-bold italic leading-[0.9] text-gray-900 tracking-tighter">
              Amarisé Luxe <br /> {city.office.city}
            </h2>
            <div className="space-y-8 pt-8">
              <ContactRow
                icon={<MapPin className="w-5 h-5 text-secondary" />}
                label="Address"
                value={city.office.address}
              />
              <ContactRow
                icon={<Phone className="w-5 h-5 text-secondary" />}
                label="Concierge"
                value={city.office.phone}
              />
              <ContactRow
                icon={<Mail className="w-5 h-5 text-secondary" />}
                label="Inquiry"
                value={city.office.email}
              />
            </div>
            <div className="pt-12 flex flex-col sm:flex-row gap-8">
              <Link
                href={city.office.mapUrl}
                target="_blank"
                className="flex-1"
              >
                <Button
                  className="w-full h-20 rounded-none bg-black text-white hover:bg-plum transition-all text-[10px] font-bold tracking-[0.5em] uppercase shadow-xl"
                  aria-label="Request Directions to Flagship"
                >
                  Request Directions
                </Button>
              </Link>
              <Link href={`/${countryCode}/appointments`} className="flex-1">
                <Button
                  variant="outline"
                  className="w-full h-20 rounded-none border-black text-[10px] font-bold tracking-[0.5em] uppercase hover:bg-black hover:text-white transition-all"
                  aria-label="Book Private Salon Appointment"
                >
                  Book Private Salon
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-12 mt-48 pt-48 border-t border-gray-100 text-center max-w-4xl">
        <div className="space-y-12">
          <ShieldCheck className="w-12 h-12 text-secondary mx-auto" />
          <h3 className="text-5xl font-headline font-bold italic tracking-tight">
            Artisanal Responsibility
          </h3>
          <p className="text-2xl text-gray-500 font-light italic leading-relaxed">
            "Every artifact available in our {city.name} atelier is certified
            for global provenance and authentic heritage compliance."
          </p>
          <div className="pt-12">
            <span className="text-[9px] font-bold uppercase tracking-[0.8em] text-gray-300">
              Maison Amarisé Global Destinations Registry
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start space-x-8 group">
      <div className="mt-1 transition-transform group-hover:scale-110 duration-500">
        {icon}
      </div>
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
          {label}
        </span>
        <p className="text-xl font-light text-gray-900 italic leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}
