"use client"

import React, { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { 
  ChevronLeft, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Zap, 
  Activity, 
  ArrowRight,
  TrendingUp,
  DollarSign,
  Play,
  Globe,
  Youtube
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CategoryMarketplace({ params }: { params: Promise<{ country: string, category: string }> }) {
  const resolvedParams = use(params);
  const { country, category } = resolvedParams;
  
  const formattedCountry = country.charAt(0).toUpperCase() + country.slice(1);
  const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
  
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All Discussions");

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/listings?country=${country}&category=${category}&q=${searchQuery}`);
        const result = await res.json();
        if (result.success) {
          setListings(result.data);
        }
      } catch (e) {
        console.error("Failed to sync sector listings", e);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchListings, 300);
    return () => clearTimeout(timer);
  }, [category, country, searchQuery]);

  const isYoutube = category.toLowerCase() === 'youtube';

  const youtubeSubCategories = [
    "Monetized Channels",
    "YouTube Investment Opportunities",
    "Super Chat Revenue Sharing",
    "YouTube Promotion",
    "Thumbnail Design",
    "Video Editing Services",
    "Channel Growth Services"
  ];

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Link href={`/marketplace/${country}`} className="inline-flex items-center gap-2 text-text-muted hover:text-brand-green transition-colors text-xs font-bold uppercase tracking-widest mb-4">
              <ChevronLeft size={16} /> Back to {formattedCountry} Hub
            </Link>
            <div className="flex items-center gap-3">
              {isYoutube ? (
                <Youtube className="w-10 h-10 text-red-500" />
              ) : (
                <TrendingUp className="w-10 h-10 text-brand-green" />
              )}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight uppercase italic font-display leading-none">
                {formattedCategory} <span className={cn(isYoutube ? "text-red-500" : "text-brand-green")}>Protocol.</span>
              </h1>
            </div>
            <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Localized Node: {formattedCountry} • Verified Intelligence</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-ghost group-focus-within:text-brand-green transition-colors" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sector identifiers..." 
                className="w-full bg-brand-surface border border-brand-border h-12 rounded-xl pl-12 pr-4 text-sm font-mono text-white outline-none focus:border-brand-green transition-all shadow-xl"
              />
            </div>
            <AppButton variant="secondary" className="h-12 border-brand-border">
              <Filter className="w-4 h-4" />
            </AppButton>
          </div>
        </header>

        {isYoutube && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-12">
            {["All Listings", ...youtubeSubCategories].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap border",
                  activeTab === tab 
                    ? "bg-red-500/10 border-red-500/30 text-red-500" 
                    : "bg-brand-surface border-brand-border text-text-muted hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 rounded-[2rem] bg-brand-surface animate-pulse border border-brand-border" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {listings.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ListingCard className="p-8 border-brand-border bg-brand-surface group hover:border-brand-green transition-all flex flex-col h-full space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                      {isYoutube ? <Youtube size={100} className="text-red-500" /> : <Zap size={100} className="text-brand-green" />}
                    </div>
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className={cn("p-3 rounded-2xl bg-brand-void border border-brand-border", isYoutube ? "text-red-500" : "text-brand-green")}>
                        {item.is_live ? <Play className="w-6 h-6 animate-pulse" /> : <Activity className="w-6 h-6" />}
                      </div>
                      {item.is_live && <Badge variant="live">LIVE BROADCAST</Badge>}
                    </div>

                    <div className="flex-1 space-y-2 relative z-10">
                      <h3 className="text-2xl font-bold text-white group-hover:text-brand-green transition-colors leading-tight italic line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-text-muted text-[10px] font-bold uppercase tracking-widest">
                        <MapPin size={12} className="text-brand-green" /> {item.creator_name || item.seller}
                      </div>
                    </div>

                    {item.type === 'investment' ? (
                      <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Investment</span>
                          <span className="text-white">₹{item.investment_amount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Expected Rev.</span>
                          <span className="text-brand-green">₹{item.expected_revenue?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Profit Share</span>
                          <span className="text-red-400">{item.investor_share}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 bg-brand-void/50 rounded-2xl border border-brand-border space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Verified Seller</span>
                          <span className="text-white">{item.seller}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-text-muted">Protocol Node</span>
                          <span className="text-brand-green">{item.id.slice(-4).toUpperCase()}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-brand-border flex items-center justify-between relative z-10">
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Settlement Value</div>
                        <div className="text-2xl font-bold text-white font-mono leading-none">{item.price?.toLocaleString()} <span className="text-xs opacity-40">{isYoutube ? "INR" : "USDT"}</span></div>
                      </div>
                      <Link href={`/marketplace/${country}/${category}/${item.id}`}>
                        <AppButton className="h-12 px-8 text-[10px] uppercase font-mono tracking-widest shadow-xl shadow-brand-green/10 group-hover:scale-105 transition-all">
                          Analyze <ArrowRight size={14} className="ml-2" />
                        </AppButton>
                      </Link>
                    </div>
                  </ListingCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-brand-surface rounded-[2.5rem] flex items-center justify-center mx-auto border border-brand-border text-text-ghost">
              <TrendingUp size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-400 uppercase tracking-widest italic font-display">Sector Node Empty</h3>
              <p className="text-sm text-gray-600 font-mono mt-2 max-w-sm mx-auto leading-relaxed">
                Zero localized listings discovered for this dynamic category identifier in the {formattedCountry} hub.
              </p>
              <Link href={`/marketplace/${country}`}>
                <AppButton variant="secondary" className="mt-8 px-10 h-12">Return to Hub Discovery</AppButton>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
