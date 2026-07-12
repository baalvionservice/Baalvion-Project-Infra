"use client"

import React, { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { 
  ChevronLeft, 
  Youtube, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink, 
  Clock, 
  Users, 
  ArrowRight,
  DollarSign,
  Play,
  Activity,
  BarChart3,
  Lock,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { MARKETPLACE_PRODUCTS } from '@/data/mockData';
import { notFound } from 'next/navigation';

export default function ListingDetailPage({ params }: { params: Promise<{ country: string, category: string, id: string }> }) {
  const resolvedParams = use(params);
  const { id, country, category } = resolvedParams;
  
  const listing = MARKETPLACE_PRODUCTS.find(p => p.id === id);
  if (!listing) return notFound();

  const isYoutube = category.toLowerCase() === 'youtube';

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-16">
          <Link href={`/marketplace/${country}/${category}`} className="inline-flex items-center gap-2 text-text-muted hover:text-brand-green transition-colors text-xs font-bold uppercase tracking-widest mb-12">
            <ChevronLeft size={16} /> Back to {category.toUpperCase()} Protocol
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge variant="success" className="px-4 py-1">VERIFIED ASSET</Badge>
                  {listing.is_live && <Badge variant="live">LIVE BROADCAST</Badge>}
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase italic font-display leading-none">
                  {listing.title}
                </h1>
                <p className="text-text-secondary text-xl font-mono leading-relaxed max-w-3xl">
                  {listing.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Merchant', val: listing.creator_name || listing.seller, icon: Users },
                  { label: 'Rating', val: `${listing.rating} / 5.0`, icon: Star },
                  { label: 'Node', val: listing.country.toUpperCase(), icon: Globe },
                ].map((stat, i) => (
                  <ListingCard key={i} className="bg-brand-surface border-brand-border p-6 flex items-center gap-4">
                    <div className="p-3 bg-brand-void border border-brand-border rounded-xl">
                      <stat.icon className="w-5 h-5 text-brand-green" />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
                      <div className="text-sm font-bold text-white">{stat.val}</div>
                    </div>
                  </ListingCard>
                ))}
              </div>

              <div className="space-y-8 pt-12 border-t border-brand-border">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-green" /> Asset Intelligence
                </h3>
                <div className="prose prose-invert max-w-none text-text-secondary leading-loose">
                  This asset has been audited by the central protocol. Trade history shows consistent performance metrics over the last 90 cycles. Escrow protection is active for all transactions involving this node ID.
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <ListingCard className="p-8 border-brand-border bg-brand-surface space-y-8 sticky top-44 shadow-2xl">
                <div className="space-y-6">
                  {listing.type === 'investment' ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-brand-void rounded-2xl border border-brand-border space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Min Investment</span>
                          <span className="text-white">₹{listing.investment_amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Target Rev.</span>
                          <span className="text-brand-green">₹{listing.expected_revenue?.toLocaleString()}</span>
                        </div>
                        <div className="pt-4 border-t border-brand-border flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Investor Share</span>
                          <span className="text-red-400 text-xl font-bold">{listing.investor_share}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Channel Reference</label>
                        <Link href={listing.youtube_channel_link || '#'} className="flex items-center justify-between p-4 bg-brand-void border border-brand-border rounded-xl text-blue-400 text-xs font-bold hover:bg-brand-void/80 transition-all">
                          Visit YouTube Channel <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Settlement Price</div>
                      <div className="text-5xl font-bold text-white font-mono">
                        {listing.price.toLocaleString()} <span className="text-xl opacity-40">INR</span>
                      </div>
                      <div className="text-sm font-bold text-brand-green uppercase tracking-widest flex items-center gap-2">
                        <DollarSign size={16} /> ≈ {listing.crypto_price} ETH
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <AppButton className="w-full h-16 text-lg font-bold uppercase italic font-display shadow-2xl shadow-brand-green/20">
                    Authorize Trade <ArrowRight size={20} className="ml-2" />
                  </AppButton>
                  <p className="text-[9px] text-text-muted text-center uppercase font-bold tracking-widest">
                    <Lock size={10} className="inline mr-1" /> SECURE ESCROW PROTECTION ACTIVE
                  </p>
                </div>

                <div className="pt-8 border-t border-brand-border space-y-4">
                  <div className="flex items-center gap-3 text-brand-green">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Verified by Node Admin</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-ghost">
                    <Clock className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Est. Settlement: 2.4 Hours</span>
                  </div>
                </div>
              </ListingCard>
            </aside>
          </div>
        </header>

        {isYoutube && listing.is_live && (
          <section className="mt-32 space-y-12">
            <div className="flex items-center gap-3">
              <Play className="w-6 h-6 text-red-500 animate-pulse" />
              <h2 className="text-3xl font-bold uppercase font-display italic">Live Intelligence <span className="text-red-500">Feed.</span></h2>
            </div>
            <ListingCard className="p-0 overflow-hidden border-brand-border bg-black aspect-video relative group flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 z-10" />
              <Play size={100} className="text-white opacity-20 group-hover:scale-110 transition-transform cursor-pointer z-20" />
              <div className="absolute bottom-10 left-10 z-30 space-y-2">
                <Badge variant="live">LIVE BROADCAST</Badge>
                <h3 className="text-2xl font-bold text-white italic">Gaming Live Stream Super Chat Investment</h3>
              </div>
            </ListingCard>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

import { Star } from 'lucide-react';
