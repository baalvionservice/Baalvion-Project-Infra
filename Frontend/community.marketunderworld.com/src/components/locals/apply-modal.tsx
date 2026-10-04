"use client"

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X, Send, Link2, ChevronDown } from "lucide-react";
import type { LocalListing } from "@/data/locals-listings";
import { COUNTRY_NAMES, getStates } from "@/data/world-geo";
import { applyToListing, ApiError } from "@/lib/api/nightlife";

export function ApplyModal({ listing, onClose }: { listing: LocalListing; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    country: "",
    state: "",
    city: "",
    phone: "",
    email: "",
    height: "",
    instagram: "",
    introVideoLink: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; needsLogin: boolean } | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.age || !form.phone || !form.country || !form.state || !form.city) return;
    setError(null);
    setSubmitting(true);
    try {
      await applyToListing(listing.slug, {
        fullName: form.name,
        phone: form.phone,
        email: form.email || undefined,
        message: form.message || undefined,
        // Blank optional fields are left out rather than sent as empty strings.
        details: {
          age: Number(form.age),
          country: form.country,
          state: form.state,
          city: form.city,
          ...(form.gender ? { gender: form.gender } : {}),
          ...(form.height ? { height: form.height } : {}),
          ...(form.instagram ? { instagram: form.instagram } : {}),
          ...(form.introVideoLink ? { introVideoLink: form.introVideoLink } : {}),
        },
      });
      setSubmitted(true);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError({
        needsLogin: status === 401,
        message: status === 401 ? "Please sign in to apply." : err instanceof Error ? err.message : "Could not submit your application.",
      });
    } finally {
      setSubmitting(false);
    }
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
              <p className="text-gray-400 max-w-sm mx-auto">Your application has been submitted. The team will review it and contact you using the details you provided.</p>
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Country *</label>
                  <div className="relative">
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value, state: "", city: "" })}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none appearance-none focus:border-fuchsia-500/50 transition-colors"
                    >
                      <option value="">Select Country</option>
                      {COUNTRY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">State / Region *</label>
                  <div className="relative">
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      disabled={!form.country}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none appearance-none focus:border-fuchsia-500/50 transition-colors disabled:opacity-50"
                    >
                      <option value="">Select State</option>
                      {form.country && getStates(form.country).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">City *</label>
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

              {(!form.name || !form.age || !form.phone || !form.country || !form.state || !form.city) && (
                <p className="text-amber-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Name, Age, WhatsApp, Country, State and City are required.
                </p>
              )}

              {error && (
                <p role="alert" className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error.message}
                  {error.needsLogin && (
                    <Link href={`/auth/signin?redirect=${encodeURIComponent(`/locals/${listing.slug}`)}`} className="underline font-bold">Sign in</Link>
                  )}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.age || !form.phone || !form.country || !form.state || !form.city}
                className="w-full h-14 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <Send className="w-5 h-5" /> {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
