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
import { cn } from "@/lib/utils";

// ─── REUSABLE APPLY MODAL ───────────────────────────────────────────────────────────────
function ApplyModal({ listing, onClose }: { listing: LocalListing; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    city: "",
    phone: "",
    email: "",
    height: "",
    instagram: "",
    introVideoLink: "",
    message: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.age || !form.phone) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#121217] border border-[#2b2b36] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-[#121217]/90 backdrop-blur-sm border-b border-white/10">
          <div>
            <h2 className="text-xl font-black">Apply for This Listing</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{listing.title}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
              <h3 className="text-2xl font-bold">Application Sent!</h3>
              <p className="text-gray-400 max-w-sm mx-auto">Your profile has been submitted. The team will review your application and contact you directly on WhatsApp or Email.</p>
              <button onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-fuchsia-600 font-bold hover:bg-fuchsia-500 transition-colors">Close</button>
            </div>
          ) : (
            <div className="space-y-4">
              {listing.minAge && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-sm text-fuchsia-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Requirement check:</strong> This listing specifically asks for Age {listing.minAge}{listing.maxAge ? `–${listing.maxAge}` : "+"}
                    {listing.gender && listing.gender !== "Any" ? ` and ${listing.gender} applicants only` : ""}.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Age *</label>
                  <input
                    type="number"
                    placeholder="e.g. 22"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Gender</label>
                  <div className="relative">
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none appearance-none focus:border-fuchsia-500/50 transition-colors"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Height (optional)</label>
                  <input
                    type="text"
                    placeholder={`e.g. 5'6"`}
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">WhatsApp *</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Email</label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Instagram Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                    <input
                      type="text"
                      placeholder="yourhandle"
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Upload Photos (max 5)</label>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-fuchsia-500/40 flex flex-col items-center justify-center gap-2 transition-colors group"
                >
                  <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-fuchsia-400 transition-colors" />
                  <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                    {photos.length > 0 ? `${photos.length} photo(s) selected` : "Click to upload your recent photos"}
                  </span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Intro Video Link (Google Drive / Instagram / YouTube)</label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.introVideoLink}
                    onChange={(e) => setForm({ ...form, introVideoLink: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Short Message</label>
                <textarea
                  rows={3}
                  placeholder="Tell them a bit about yourself..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500/50 transition-colors resize-none"
                />
              </div>

              {(!form.name || !form.age || !form.phone) && (
                <p className="text-amber-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Name, Age, and WhatsApp are required.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.age || !form.phone}
                className="w-full h-14 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <Send className="w-5 h-5" /> Submit Application
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

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
