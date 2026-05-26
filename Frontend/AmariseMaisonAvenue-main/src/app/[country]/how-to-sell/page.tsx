"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

/**
 * HowToSellPage: Replicated "Sell or Consign" Informational Page.
 * Features a high-fidelity dual-panel hero, an authority text section, and a procedural "How it Works" grid.
 */
export default function HowToSellPage() {
  const { country } = useParams();
  const countryCode = (country as string) || "us";

  return (
    <div className="bg-white min-h-screen animate-fade-in font-body">
      {/* 1. Cinematic Dual-Panel Hero */}
      <section className="relative flex flex-col md:flex-row h-auto md:h-[600px] overflow-hidden bg-black">
        {/* Left Panel: Narrative & CTA */}
        <div className="w-full md:w-[45%] p-12 md:p-24 flex flex-col justify-center space-y-8 bg-black text-white">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-headline font-bold italic leading-tight tracking-tight">
              Sell or Consign with <br /> Amarisé Maison
            </h1>
            <p className="text-sm md:text-base font-light leading-relaxed text-gray-300 max-w-md italic">
              We offer the most personalized way to sell or consign your
              designer bags or jewelry. Earn up to 85% of the market price for
              your mint, new, vintage, or pre-owned items.
            </p>
          </div>

          <div className="space-y-6 pt-4">
            <Link href={`/${countryCode}/sell`}>
              <Button className="h-14 px-12 bg-[#E1D3DC] text-gray-900 hover:bg-[#D8C4D1] rounded-none text-[10px] font-bold tracking-[0.3em] uppercase transition-all shadow-xl">
                START SELLING
              </Button>
            </Link>

            <div className="block">
              <Link
                href={`/${countryCode}/sell`}
                className="text-[10px] font-bold tracking-[0.2em] text-white hover:text-gold transition-colors uppercase border-b border-white/20 pb-1"
              >
                LOGIN TO OUR SELLING PORTAL
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel: Visual Resonance */}
        <div className="w-full md:w-[55%] relative h-[400px] md:h-auto overflow-hidden">
          <Image
            src="https://picsum.photos/seed/amarise-consign/1440/960"
            alt="Maison Amarisé Heritage Collection - Hermès Series"
            fill
            className="object-cover transition-transform duration-[5s] hover:scale-105"
            priority
            sizes="60vw"
            data-ai-hint="luxury fashion"
          />
          <div className="absolute inset-0 bg-black/5" />
        </div>
      </section>

      {/* 2. Institutional Authority Section */}
      <section className="container mx-auto px-12 py-32 max-w-6xl">
        <div className="text-center space-y-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <p className="text-[13px] md:text-base text-gray-600 font-light leading-relaxed italic text-justify md:text-center">
              If you're looking to sell or consign your designer bag, jewelry or
              accessories, entrust it to the care and knowledge of people who
              know luxury — Amarisé Maison. We are one of the leading sellers
              and buyers of Hermès and Chanel handbags and accessories in the
              secondary market. We bring our years of experience and expertise
              buying and selling designer bags to evaluate your bags so that we
              can offer you the best price. We specialize in selling store-fresh
              luxury bags, so we prefer to purchase never worn bags outright. We
              also accept recently produced and vintage pre-owned bags in
              excellent to like new condition, jewelry and accessories.
            </p>
          </div>

          <div className="pt-8">
            <div className="h-px w-24 bg-gold mx-auto opacity-30" />
          </div>
        </div>
      </section>

      {/* 3. Procedural "How it Works" Section */}
      <section className="container mx-auto px-6 py-24 border-t border-gray-100">
        <div className="text-center space-y-24">
          <h2 className="text-2xl font-headline font-bold uppercase tracking-widest text-gray-900">
            HOW IT WORKS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center space-y-12 group">
              <div className="relative w-48 h-48 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-gray-900 fill-none stroke-current stroke-[0.5px]"
                >
                  <path d="M20 40 L80 40 L85 85 L15 85 Z" />
                  <path d="M35 40 C35 25, 65 25, 65 40" />
                  <path d="M45 40 L45 50 M55 40 L55 50" />
                  <path d="M15 85 L85 85" />
                </svg>
              </div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-900 uppercase">
                SUBMIT & GET AN ESTIMATE
              </h3>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center space-y-12 group">
              <div className="relative w-48 h-48 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-gray-900 fill-none stroke-current stroke-[0.5px]"
                >
                  <path d="M20 50 L20 85 L80 85 L80 50" />
                  <path d="M20 50 L10 35 L50 35 L50 50" />
                  <path d="M80 50 L90 35 L50 35" />
                  <path d="M40 60 L60 60 L62 75 L38 75 Z" opacity="0.5" />
                  <path d="M45 60 C45 55, 55 55, 55 60" opacity="0.5" />
                </svg>
              </div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-900 uppercase">
                SHIP US YOUR ITEM
              </h3>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center space-y-12 group">
              <div className="relative w-48 h-48 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-gray-900 fill-none stroke-current stroke-[0.5px]"
                >
                  <path d="M30 70 C20 70, 10 60, 10 50 C10 40, 20 30, 35 30" />
                  <path d="M70 70 C80 70, 90 60, 90 50 C90 40, 80 30, 65 30" />
                  <rect
                    x="35"
                    y="35"
                    width="30"
                    height="15"
                    rx="1"
                    transform="rotate(-15 50 42)"
                  />
                  <rect x="35" y="45" width="30" height="15" rx="1" />
                  <rect
                    x="35"
                    y="55"
                    width="30"
                    height="15"
                    rx="1"
                    transform="rotate(15 50 62)"
                  />
                </svg>
              </div>
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-900 uppercase">
                GET PAID
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Final Step Gateway */}
      <section className="bg-ivory py-24 border-t border-gray-100">
        <div className="container mx-auto px-6 text-center space-y-8">
          <h3 className="text-2xl font-headline font-bold italic text-gray-900">
            Ready to begin your consignment?
          </h3>
          <p className="text-sm text-gray-500 font-light max-w-xl mx-auto italic">
            "Every artifact has a story. Our curators ensure yours finds its
            next rightful guardian with absolute transparency."
          </p>
          <Link href={`/${countryCode}/sell`}>
            <Button
              variant="outline"
              className="rounded-none border-gray-900 h-14 px-16 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-black hover:text-white transition-all"
            >
              PROCEED TO SELL PORTAL
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
