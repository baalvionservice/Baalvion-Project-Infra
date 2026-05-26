import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, PlayCircle, Calendar, Users, Target, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const metadata: Metadata = {
  title: '2025 Investor Day | Strategic Roadmap',
  description: 'Access recordings and presentations from Baalvion’s 2025 Investor Day, detailing our 5-year strategic vision.',
};

export default function InvestorDayPage() {
  const heroImg = PlaceHolderImages.find(p => p.id === 'news-3-image');

  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-black text-white relative overflow-hidden">
        {heroImg && (
          <div className="absolute inset-0 opacity-30">
            <img src={heroImg.imageUrl} alt="" className="w-full h-full object-cover grayscale" />
          </div>
        )}
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-primary tracking-[0.2em] mb-4 uppercase">Featured Event</p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-8">
              Baalvion <br />
              Investor Day 2025
            </h1>
            <div className="flex flex-wrap gap-6 mb-12">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-bold">June 12, 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-primary" />
                <span className="font-bold">New York City</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Button size="lg" className="rounded-none h-14 px-8 font-bold uppercase tracking-widest bg-primary hover:bg-primary/90">
                <PlayCircle className="mr-2 h-5 w-5" /> Watch Recording
              </Button>
              <Button variant="outline" size="lg" className="rounded-none h-14 px-8 font-bold uppercase tracking-widest border-white text-white hover:bg-white hover:text-black">
                Download PDF &gt;
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white text-black">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              { icon: Target, title: "Strategic Vision", desc: "A deep dive into our move toward a unified ledger for global B2B trade." },
              { icon: Users, title: "Execution Leaders", desc: "Presentations from functional heads across engineering and logistics." },
              { icon: Download, title: "Data Packets", desc: "Consolidated financial models and strategic whitepapers for analysts." },
            ].map((feature, idx) => (
              <Card key={idx} className="rounded-none border-none bg-gray-50 p-8">
                <feature.icon className="h-10 w-10 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>

          <div className="space-y-12">
            <h2 className="text-3xl font-bold tracking-tight border-b border-gray-200 pb-6">Presentation Highlights</h2>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Keynote</span>
                    <span className="text-xs text-gray-400">42:15</span>
                  </div>
                  <h4 className="text-xl font-bold group-hover:text-primary transition-colors">The Next Century of B2B Infrastructure</h4>
                  <p className="text-sm text-gray-500 mt-2">Founder Deepak Kumar Kuldeep outlines the long-term roadmap.</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Financials</span>
                    <span className="text-xs text-gray-400">28:30</span>
                  </div>
                  <h4 className="text-xl font-bold group-hover:text-primary transition-colors">Capital Allocation & Margin Expansion</h4>
                  <p className="text-sm text-gray-500 mt-2">CFO session on maintaining 30% IRR benchmarks across SPVs.</p>
                </div>
              </div>
              <div className="aspect-video bg-gray-900 flex items-center justify-center group cursor-pointer relative overflow-hidden">
                <img src={heroImg?.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
                <div className="relative z-10 h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                  <PlayCircle className="h-8 w-8 text-white ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MapPinIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
