"use client"

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { 
  ChevronLeft, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink, 
  Clock, 
  ArrowRight,
  DollarSign,
  Play,
  Activity,
  BarChart3,
  Lock,
  MessageSquare,
  AlertCircle,
  Globe
} from 'lucide-react';
import { CREATOR_INVESTMENTS, CREATORS } from '@/data/mockData';
import { notFound, useRouter } from 'next/navigation';

export default function InvestmentDetailPage({ params }: { params: Promise<{ country: string, platform: string, id: string }> }) {
  const resolvedParams = use(params);
  const { id, country, platform } = resolvedParams;
  const router = useRouter();
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const listing = CREATOR_INVESTMENTS.find(p => p.id === id);
  if (!listing) return notFound();

  const creator = CREATORS.find(c => c.id === listing.creatorId);

  const handleAuthorize = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      router.push(`/investor/dashboard?new_invest=${id}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-16">
          <Link href={`/marketplace/${country}/creators/${platform}`} className="inline-flex items-center gap-2 text-text-muted hover:text-blue-400 transition-colors text-xs font-bold uppercase tracking-widest mb-12">
            <ChevronLeft size={16} /> Back to {platform.toUpperCase()} Equity
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge variant="success" className="px-4 py-1">VERIFIED CREATOR EQUITY</Badge>
                  {listing.isLive && <Badge variant="live">LIVE BROADCAST ACTIVE</Badge>}
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase italic font-display leading-none">
                  {listing.title}
                </h1>
                <p className="text-text-secondary text-xl font-mono leading-relaxed max-w-3xl">
                  {listing.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ListingCard className="bg-brand-surface border-brand-border p-6 flex items-center gap-4">
                  <div className="p-3 bg-brand-void border border-brand-border rounded-xl">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Creator Node</div>
                    <div className="text-sm font-bold text-white">{listing.creatorName}</div>
                  </div>
                </ListingCard>
                <ListingCard className="bg-brand-surface border-brand-border p-6 flex items-center gap-4">
                  <div className="p-3 bg-brand-void border border-brand-border rounded-xl">
                    <BarChart3 className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Growth Metric</div>
                    <div className="text-sm font-bold text-white">{creator?.followers.toLocaleString()} Follows</div>
                  </div>
                </ListingCard>
                <ListingCard className="bg-brand-surface border-brand-border p-6 flex items-center gap-4">
                  <div className="p-3 bg-brand-void border border-brand-border rounded-xl">
                    <Globe className="w-5 h-5 text-semantic-info" />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Node Segment</div>
                    <div className="text-sm font-bold text-white">{country.toUpperCase()}</div>
                  </div>
                </ListingCard>
              </div>

              <div className="space-y-8 pt-12 border-t border-brand-border">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" /> Trade Protocol Intelligence
                </h3>
                <div className="prose prose-invert max-w-none text-text-secondary leading-loose space-y-6">
                  <p>
                    This creator has fulfilled 4 prior investment cycles with an average settlement accuracy of 98.4%. The revenue-share distribution is handled automatically via the Underworld Escrow Protocol.
                  </p>
                  <div className="p-6 bg-brand-void border border-brand-border rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-5 h-5 text-semantic-warning shrink-0 mt-1" />
                    <p className="text-xs font-mono text-text-muted uppercase leading-relaxed">
                      Revenue distribution occurs every 30 cycles post-investment. The platform fee of {listing.platformFee}% is deducted at the source of payout.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <ListingCard className="p-8 border-brand-border bg-brand-surface space-y-10 sticky top-44 shadow-2xl ring-1 ring-blue-400/10">
                <div className="space-y-6 text-center">
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Authorized Allocation</div>
                  <div className="space-y-2">
                    <div className="text-5xl font-bold text-white font-mono leading-none">
                      ₹{listing.investmentRequired.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center justify-center gap-2">
                      ≈ {(listing.investmentRequired / 290000).toFixed(3)} ETH
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-brand-void rounded-2xl border border-brand-border space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-text-muted">Investor Share</span>
                      <span className="text-blue-400 text-lg">{listing.investorShare}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-text-muted">Target Yield</span>
                      <span className="text-brand-green text-lg">₹{listing.expectedRevenue.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-brand-border flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-text-muted">Platform Node Fee</span>
                      <span className="text-text-ghost">{listing.platformFee}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <AppButton 
                    onClick={handleAuthorize}
                    isLoading={isAuthorizing}
                    className="w-full h-16 text-lg font-bold uppercase italic font-display shadow-2xl shadow-blue-400/20 bg-blue-400 text-black hover:bg-blue-300"
                  >
                    Lock Allocation <ArrowRight size={20} className="ml-2" />
                  </AppButton>
                  <p className="text-[9px] text-text-muted text-center uppercase font-bold tracking-widest">
                    <Lock size={10} className="inline mr-1" /> REVENUE SHARE ESCROW PROTOCOL ACTIVE
                  </p>
                </div>

                <div className="pt-8 border-t border-brand-border space-y-4">
                  <div className="flex items-center gap-3 text-brand-green">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Verified Multi-Sig Control</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-ghost">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Direct Comms with Operator</span>
                  </div>
                </div>
              </ListingCard>
            </aside>
          </div>
        </header>

        {listing.isLive && (
          <section className="mt-32 space-y-12">
            <div className="flex items-center gap-3">
              <Play className="w-6 h-6 text-red-500 animate-pulse" />
              <h2 className="text-3xl font-bold uppercase font-display italic">Live Intelligence <span className="text-red-500">Feed.</span></h2>
            </div>
            <ListingCard className="p-0 overflow-hidden border-brand-border bg-black aspect-video relative group flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 z-10" />
              <Play size={100} className="text-white opacity-20 group-hover:scale-110 transition-transform cursor-pointer z-20" />
              <div className="absolute bottom-10 left-10 z-30 space-y-2">
                <Badge variant="live">LIVE OPERATIONAL FEED</Badge>
                <h3 className="text-2xl font-bold text-white italic">Current Active Revenue Cycle Monitoring</h3>
              </div>
            </ListingCard>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}