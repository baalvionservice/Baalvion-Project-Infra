"use client"

import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Music,
  HeartHandshake,
  Plane,
  Search,
  Flame,
  Users,
  Calendar,
  Phone,
  CheckCircle2,
  Plus,
  X,
  Upload,
  Lock,
  Send,
  AlertCircle,
  Image as ImageIcon,
  Link2,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

import type { LocalListing, Category } from "@/data/locals-listings";
import { ApplyModal } from "@/components/locals/apply-modal";



const ICONS = {
  "Casting & Jobs": Briefcase,
  Events: Music,
  Matchmaking: HeartHandshake,
  Travel: Plane,
  All: Flame,
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export function LocalsClient({ initialListings }: { initialListings: LocalListing[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const listings = initialListings;
  const [applyListing, setApplyListing] = useState<LocalListing | null>(null);

  const filteredListings = listings.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.type === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Navbar />

      {/* Apply Modal */}
      <AnimatePresence>
        {applyListing && (
          <ApplyModal
            listing={applyListing}
            onClose={() => setApplyListing(null)}
          />
        )}
      </AnimatePresence>

      <main className="container max-w-[1440px] mx-auto px-6 pt-44 pb-32">
        {/* Hero */}
        <header className="mb-16 space-y-8 relative">
          <div className="absolute top-0 right-10 w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-fuchsia-400 uppercase tracking-[0.3em] border border-fuchsia-500/20 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" /> Locals Hub · Mumbai & Beyond
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                Casting. Events. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600">
                  Local Opportunities.
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl font-medium mt-6">
                Verified casting calls, UGC shoots, dancer requirements, wedding shows, and exclusive local events in Mumbai, Delhi, and Goa.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 max-w-3xl relative z-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search jobs, shoots, cities (e.g. Mumbai UGC)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 outline-none focus:border-fuchsia-500/50 transition-colors"
              />
            </div>
            <button className="h-14 px-8 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" /> Mumbai
            </button>
          </div>
        </header>

        {/* Category Filter */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-10 pb-2">
          {(Object.keys(ICONS) as Category[]).map((category) => {
            const Icon = ICONS[category];
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all border whitespace-nowrap",
                  isActive
                    ? "bg-fuchsia-600 border-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-fuchsia-400")} />
                {category}
              </button>
            );
          })}
        </div>

        {/* Listings Feed */}
        {/* ── XENFORO STYLE LOCALS LISTINGS TABLE ── */}
        <div className="xen-category-block rounded-lg overflow-hidden border border-[#2b2b36] bg-[#121217] shadow-xl mt-4">
          <div className="xen-cat-header flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#1c1824] via-[#221c2e] to-[#1a1622] border-b border-[#2e293a]">
            <span className="text-base md:text-lg font-bold text-[#e6d8c8] tracking-wide flex items-center gap-2">
              Locals Hub Threads
            </span>
          </div>

          <div className="divide-y divide-[#202029]">
            {filteredListings.length === 0 ? (
              <div className="p-12 text-center text-gray-500 bg-[#14141a]">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-300 mb-2">No threads found</h3>
                <p className="text-gray-500">Try adjusting your search or switching categories.</p>
              </div>
            ) : (
              filteredListings.map((listing) => {
                const Icon = ICONS[listing.type] || Flame;
                return (
                  <div
                    key={listing.id}
                    className="xen-node-row group flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-[#14141a] hover:bg-[#191922] transition-colors gap-4"
                  >
                    {/* Left Column: Icon + Title + Meta */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Link
                        href={`/locals/${listing.slug}`}
                        className="w-11 h-11 shrink-0 rounded-md bg-[#24171d] border border-fuchsia-900/40 flex items-center justify-center shadow-inner group-hover:border-fuchsia-600/60 transition-colors"
                      >
                        <Icon className="w-6 h-6 text-fuchsia-500 group-hover:scale-110 transition-transform" />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {listing.verified && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-950/60 border border-green-800/60 text-green-400">
                              VERIFIED
                            </span>
                          )}
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-fuchsia-950/60 border border-fuchsia-800/60 text-fuchsia-300">
                            {listing.type.toUpperCase()}
                          </span>
                          
                          <Link
                            href={`/locals/${listing.slug}`}
                            className="text-base font-bold text-[#f0f0f5] group-hover:text-fuchsia-400 transition-colors hover:underline"
                          >
                            {listing.title}
                          </Link>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8c8c9e] leading-relaxed">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-fuchsia-500/80" /> {listing.location}</span>
                          {listing.minAge && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-amber-500/80" /> Age {listing.minAge}{listing.maxAge ? `–${listing.maxAge}` : "+"}
                            </span>
                          )}
                          {listing.date && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-500/80" /> {listing.date}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Apply Button */}
                    <div className="flex items-center justify-center lg:w-44 shrink-0 px-2 lg:px-4 py-1.5 lg:py-0 border-t lg:border-t-0 border-[#242430]">
                      <button
                        onClick={() => setApplyListing(listing)}
                        className="w-full max-w-[140px] flex items-center justify-center gap-1.5 h-8 px-3 rounded bg-[#2a1b24] hover:bg-[#3f2233] border border-fuchsia-900/60 text-fuchsia-300 font-bold text-xs transition-colors"
                      >
                        <Send className="w-3 h-3" /> Apply Now
                      </button>
                    </div>

                    {/* Right Column: Latest Activity / Author */}
                    <div className="lg:w-72 shrink-0 flex items-center gap-3 border-t lg:border-t-0 border-[#242430] pt-2 lg:pt-0">
                      <div
                        className="w-9 h-9 shrink-0 rounded flex items-center justify-center text-white font-bold text-sm shadow bg-[#c0392b]"
                      >
                        {listing.postedBy.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="block text-xs font-semibold text-[#cfcfdc] truncate">
                          Thread Started By
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                          <span>{listing.postedAt}</span>
                          <span className="mx-1.5 opacity-60">·</span>
                          <span className="text-gray-300 hover:text-white cursor-pointer font-bold">
                            {listing.postedBy}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
