"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import {
  ChevronLeft,
  Lightbulb,
  Package,
  ArrowRight,
  Share2,
  Bookmark,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/ProductCard";
import { generateBuyingGuideNarrative } from "@/ai/flows/generate-buying-guide-narrative";
import { COUNTRIES } from "@/lib/mock-data";

/**
 * BuyingGuideDetailPage: High-authority editorial guide.
 * Features HowTo Structured Data for improved Google Rich Result rankings.
 */
export default function BuyingGuideDetailPage() {
  const { id, country } = useParams();
  const { buyingGuides, products, collections } = useAppStore();
  const countryCode = (country as string) || "us";
  const currentCountry = COUNTRIES[countryCode] || COUNTRIES.us;

  const guide = buyingGuides.find((g) => g.id === id);
  const featured = products.filter((p) =>
    guide?.featuredProducts.includes(p.id)
  );
  const relCollections = collections.filter((c) =>
    guide?.featuredCollections.includes(c.id)
  );

  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(true);

  useEffect(() => {
    if (!guide) return;
    async function fetchAiNarrative() {
      setLoadingAi(true);
      try {
        const res = await generateBuyingGuideNarrative({
          category: guide?.category || "",
          country: currentCountry.name,
        });
        setAiNarrative(res.narrative);
        setAiTips(res.tips);
      } catch (e) {
        setAiNarrative(null);
      } finally {
        setLoadingAi(false);
      }
    }
    fetchAiNarrative();
  }, [guide, currentCountry.name]);

  if (!guide) {
    return (
      <div className="py-40 text-center font-headline text-3xl">
        Intelligence record not found.
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-ivory">
      {/* SEO Structured Data: HowTo Authority */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: guide.title,
            description: guide.metaDescription || guide.excerpt,
            image: guide.imageUrl,
            author: { "@type": "Person", name: guide.author },
            datePublished: guide.date,
            step: (guide.tips || []).map((tip, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              text: tip,
            })),
          }),
        }}
      />

      {/* Hero Header */}
      <section className="relative h-[70vh] w-full flex items-end overflow-hidden border-b border-border">
        <Image
          src={guide.imageUrl}
          alt={guide.title}
          fill
          className="object-cover opacity-80 animate-slow-zoom"
          priority
          data-ai-hint="luxury tutorial"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/10 to-transparent" />
        <div className="container mx-auto px-12 pb-24 relative z-10 max-w-[1600px]">
          <Link
            href={`/${countryCode}/buying-guide`}
            className="inline-flex items-center text-[10px] tracking-[0.4em] uppercase text-gray-900 hover:text-plum transition-colors mb-12 font-bold"
          >
            <ChevronLeft className="w-3 h-3 mr-2" /> Back to Intelligence
          </Link>
          <div className="space-y-8 max-w-5xl">
            <div className="flex items-center space-x-8">
              <span className="text-secondary text-xs font-bold tracking-[0.5em] uppercase px-4 py-1.5 border border-secondary/20 rounded-none bg-white/50 backdrop-blur-sm">
                {guide.category} Masterclass
              </span>
              <span className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                Archives Vol. {id?.toString().split("-").pop()}
              </span>
            </div>
            <h1 className="text-7xl md:text-9xl font-headline font-bold text-gray-900 leading-[0.9] italic tracking-tighter">
              {guide.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Main Authority Content */}
      <section className="container mx-auto px-12 py-40 grid grid-cols-1 lg:grid-cols-12 gap-32 items-start max-w-[1600px]">
        <div className="lg:col-span-8 space-y-32">
          <div className="space-y-16">
            <div className="flex items-center space-x-6 text-gray-400">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
                The Narrative
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {loadingAi ? (
              <div className="space-y-8 animate-pulse">
                <div className="h-6 bg-muted w-full" />
                <div className="h-6 bg-muted w-5/6" />
                <div className="h-6 bg-muted w-4/6" />
              </div>
            ) : (
              <div className="prose prose-2xl font-light leading-relaxed text-gray-700 italic first-letter:text-9xl first-letter:font-headline first-letter:text-black first-letter:float-left first-letter:mr-6 first-letter:mt-4 whitespace-pre-wrap selection:bg-secondary/20">
                {aiNarrative || guide.content}
              </div>
            )}
          </div>

          <div className="bg-white p-20 border border-border shadow-luxury relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-64 h-64 text-black" />
            </div>
            <div className="relative z-10 space-y-10">
              <div className="flex items-center space-x-4">
                <TrendingUp className="w-8 h-8 text-secondary" />
                <h2 className="text-4xl font-headline font-bold italic">
                  Market Intelligence
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Investment Trajectory
                  </h3>
                  <p className="text-xl text-gray-600 font-light italic leading-relaxed">
                    {guide.investmentOutlook ||
                      "Our senior curators have observed a consistent appreciation in artifacts of this provenance, averaging 14% annually within the global collector market."}
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-ivory border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        Resale Liquidity
                      </span>
                      <span className="text-[10px] font-bold text-secondary">
                        HIGH
                      </span>
                    </div>
                    <div className="h-1 bg-gray-100 w-full">
                      <div className="h-full bg-secondary w-[85%]" />
                    </div>
                  </div>
                  <div className="p-6 bg-ivory border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        Heritage Scarcity
                      </span>
                      <span className="text-[10px] font-bold text-secondary">
                        ABSOLUTE
                      </span>
                    </div>
                    <div className="h-1 bg-gray-100 w-full">
                      <div className="h-full bg-secondary w-[95%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-20">
            <div className="flex flex-col items-center text-center space-y-4">
              <Lightbulb className="w-10 h-10 text-secondary" />
              <h2 className="text-5xl font-headline font-bold italic">
                The Provenance Protocol
              </h2>
              <p className="text-gray-400 text-[10px] uppercase tracking-[0.5em] font-bold">
                Artisanal Identification & Verification
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {(aiTips.length > 0 ? aiTips : guide.tips || []).map(
                (tip, idx) => (
                  <div
                    key={idx}
                    className="p-12 bg-white border border-border hover:border-plum transition-all group relative overflow-hidden shadow-sm"
                  >
                    <span className="text-[150px] font-headline font-bold text-gray-50 absolute -bottom-10 -right-4 pointer-events-none group-hover:text-plum/5 transition-colors">
                      0{idx + 1}
                    </span>
                    <div className="relative z-10 space-y-6">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">
                        Step 0{idx + 1}
                      </span>
                      <p className="text-2xl text-gray-900 font-light italic leading-tight">
                        {tip}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-16 sticky top-40">
          <div className="bg-black p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-headline font-bold italic mb-4">
                  Consult a Specialist
                </h3>
                <p className="text-xs text-white/60 font-light leading-relaxed italic">
                  "The absolute requirement for rarity necessitates a private
                  dialogue. Our specialist curators are available for bespoke
                  digital tours of these artifacts."
                </p>
              </div>
              <Link href={`/${countryCode}/contact`} className="block">
                <Button className="w-full h-16 bg-white text-black hover:bg-secondary hover:text-white transition-all text-[10px] font-bold tracking-[0.4em] uppercase rounded-none">
                  Inquire Privately
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-8 p-10 bg-white border border-border shadow-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 border-b border-gray-100 pb-4">
              Collective Resonance
            </h4>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 rounded-none border-gray-100 hover:border-plum text-[9px] font-bold tracking-widest uppercase"
              >
                <Share2 className="w-3.5 h-3.5 mr-2" /> Share
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-none border-gray-100 hover:border-plum text-[9px] font-bold tracking-widest uppercase"
              >
                <Bookmark className="w-3.5 h-3.5 mr-2" /> Save
              </Button>
            </div>
          </div>

          {relCollections.length > 0 && (
            <div className="space-y-8">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
                Contextual Edits
              </h4>
              <div className="space-y-4">
                {relCollections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/${countryCode}/collection/${col.id}`}
                    className="group flex items-center space-x-6 p-6 bg-white border border-border hover:border-black transition-all shadow-sm"
                  >
                    <div className="relative w-20 h-24 shrink-0 bg-muted overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-[6px] font-bold uppercase text-gray-300">
                        Asset
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-secondary">
                        Collection
                      </span>
                      <h5 className="text-lg font-headline font-bold italic text-gray-900 group-hover:text-secondary transition-colors line-clamp-1">
                        {col.name}
                      </h5>
                    </div>
                    <ChevronLeft className="w-4 h-4 rotate-180 ml-auto text-gray-200 group-hover:text-black transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      <section className="container mx-auto px-12 py-40 border-t border-border max-w-[1600px]">
        <div className="flex flex-col md:row items-end justify-between mb-24 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-secondary">
              <Package className="w-6 h-6" />
              <span className="text-[10px] font-bold tracking-[0.5em] uppercase">
                The Selection
              </span>
            </div>
            <h2 className="text-6xl font-headline font-bold italic text-gray-900 leading-none">
              Artifacts to Consider
            </h2>
          </div>
          <Link
            href={`/${countryCode}/category/hermes`}
            className="text-[10px] font-bold tracking-[0.4em] uppercase text-black hover:text-plum transition-all border-b border-black pb-2 flex items-center"
          >
            Explore Full Atelier <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-white py-48 border-t border-border text-center">
        <div className="max-w-4xl mx-auto space-y-16 px-12">
          <div className="inline-flex items-center justify-center p-6 bg-ivory border border-secondary/10 rounded-full shadow-lg">
            <ShieldCheck className="w-8 h-8 text-secondary" />
          </div>
          <div className="space-y-8">
            <h3 className="text-5xl md:text-6xl font-headline font-bold italic tracking-tight">
              The Heritage Registry
            </h3>
            <p className="text-gray-500 font-light italic leading-relaxed text-xl max-w-2xl mx-auto">
              "True discovery is an architectural process. Continue your journey
              through the Maison's collective archives."
            </p>
          </div>
          <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-12">
            <Link href={`/${countryCode}/journal`}>
              <Button
                variant="outline"
                className="h-16 px-16 rounded-none border-black text-[10px] tracking-[0.4em] font-bold hover:bg-black hover:text-white transition-all uppercase"
              >
                The Journal
              </Button>
            </Link>
            <Link href={`/${countryCode}/buying-guide`}>
              <Button className="h-16 px-16 rounded-none bg-black text-white hover:bg-plum transition-all text-[10px] tracking-[0.4em] font-bold uppercase shadow-2xl">
                All Intelligence
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
