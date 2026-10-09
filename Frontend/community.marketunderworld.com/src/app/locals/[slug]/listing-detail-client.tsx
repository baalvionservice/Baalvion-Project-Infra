"use client"

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Phone,
  CheckCircle2,
  Users,
  Briefcase,
  AlertCircle,
  X,
  Send,
  Image as ImageIcon,
  Link2,
  ChevronDown,
  ArrowLeft,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LocalListing } from "@/data/locals-listings";
import { ApplyModal } from "@/components/locals/apply-modal";
import { cn } from "@/lib/utils";

// ─── MAIN DETAIL PAGE CLIENT ────────────────────────────────────────────────────────
export function ListingDetailClient({ listing }: { listing: LocalListing }) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Navbar />

      <AnimatePresence>
        {showApplyModal && (
          <ApplyModal
            listing={listing}
            onClose={() => setShowApplyModal(false)}
          />
        )}
      </AnimatePresence>

      <main className="container max-w-[1000px] mx-auto px-6 pt-32 pb-32">
        <Link href="/locals" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Locals Hub
        </Link>

        <article className="rounded-3xl bg-[#121217] border border-[#2b2b36] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
             <Briefcase className="w-64 h-64" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-fuchsia-400">
                  {listing.type}
                </span>
                {listing.gender && listing.gender !== "Any" && (
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    {listing.gender} Only
                  </span>
                )}
                {listing.minAge && (
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Age {listing.minAge}{listing.maxAge ? `–${listing.maxAge}` : "+"}
                  </span>
                )}
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1 ml-2">
                  <MapPin className="w-3.5 h-3.5" /> {listing.location}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-4">
                {listing.title}
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  {listing.verified ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Users className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="font-bold text-gray-300">{listing.postedBy}</span>
                </div>
                <span className="text-gray-500">Posted {listing.postedAt}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => setShowApplyModal(true)}
                className="h-12 px-8 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 font-bold transition-colors shadow-[0_0_20px_rgba(217,70,239,0.2)]"
              >
                Apply Now →
              </button>
              <button
                onClick={handleShare}
                className="h-12 px-8 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-colors border border-white/10 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> {copied ? "Link Copied!" : "Share Link"}
              </button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none relative z-10">
            <h3 className="text-xl font-bold text-white mb-4">Description</h3>
            <p className="text-gray-300 text-lg leading-relaxed mb-10">
              {listing.description}
            </p>

            {listing.requirements && listing.requirements.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-4">Requirements</h3>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <ul className="space-y-3 m-0 list-none p-0">
                    {listing.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300 text-base m-0">
                        <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-2 shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <h3 className="text-xl font-bold text-white mb-4">Key Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {listing.date && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-fuchsia-400 text-sm font-bold uppercase tracking-widest mb-2">
                    <Calendar className="w-4 h-4" /> Date / Duration
                  </div>
                  <div className="text-white font-medium">{listing.date}</div>
                </div>
              )}
              {listing.salary && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-bold uppercase tracking-widest mb-2">
                    <Briefcase className="w-4 h-4" /> Compensation
                  </div>
                  <div className="text-white font-medium">{listing.salary}</div>
                </div>
              )}
              {listing.contact && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 sm:col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-bold uppercase tracking-widest mb-2">
                    <Phone className="w-4 h-4" /> Direct Contact
                  </div>
                  <div className="text-white font-medium">{listing.contact}</div>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
