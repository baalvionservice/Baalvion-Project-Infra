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

import { ALL_LISTINGS, LocalListing, Category } from "@/data/locals-listings";



const ICONS = {
  "Casting & Jobs": Briefcase,
  Events: Music,
  Matchmaking: HeartHandshake,
  Travel: Plane,
  All: Flame,
};

// ─── ADMIN POST MODAL ──────────────────────────────────────────────────────────
function AdminPostModal({ onClose, onPost }: { onClose: () => void; onPost: (l: LocalListing) => void }) {
  const [adminPass, setAdminPass] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "Casting & Jobs" as Exclude<Category, "All">,
    location: "",
    description: "",
    requirements: "",
    contact: "",
    date: "",
    salary: "",
    minAge: "",
    maxAge: "",
    gender: "Any" as "Male" | "Female" | "Any",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleUnlock = () => {
    if (adminPass === "admin123") {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect admin password.");
    }
  };

  const handlePost = () => {
    if (!form.title || !form.location || !form.description) {
      setError("Title, Location, and Description are required.");
      return;
    }
    const newListing: LocalListing = {
      id: `listing-${Date.now()}`,
      slug: `listing-${Date.now()}`,
      title: form.title,
      type: form.type,
      location: form.location,
      city: form.location.split(',')[0] || "Unknown",
      description: form.description,
      requirements: form.requirements ? form.requirements.split("\n").filter(Boolean) : [],
      contact: form.contact || undefined,
      date: form.date || undefined,
      salary: form.salary || undefined,
      minAge: form.minAge ? parseInt(form.minAge) : undefined,
      maxAge: form.maxAge ? parseInt(form.maxAge) : undefined,
      gender: form.gender,
      postedBy: "Admin",
      verified: true,
      postedAt: "Just now",
    };
    onPost(newListing);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#121217] border border-[#2b2b36] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black">Admin — Post New Listing</h2>
            <p className="text-sm text-gray-500 mt-0.5">Requires admin password</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
              <h3 className="text-2xl font-bold">Listing Published!</h3>
              <p className="text-gray-400">Your casting call / event is now live on the hub.</p>
              <button onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-fuchsia-600 font-bold hover:bg-fuchsia-500 transition-colors">Done</button>
            </div>
          ) : !unlocked ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                <Lock className="w-5 h-5 shrink-0" />
                <span>This section is restricted to admins only. Enter the admin password to proceed.</span>
              </div>
              <input
                type="password"
                placeholder="Admin password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
              />
              {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
              <button onClick={handleUnlock} className="w-full h-12 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 font-bold transition-colors">
                Unlock Admin Panel
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Type</label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none appearance-none focus:border-fuchsia-500/50 transition-colors"
                    >
                      <option value="Casting & Jobs">Casting & Jobs</option>
                      <option value="Events">Events</option>
                      <option value="Matchmaking">Matchmaking</option>
                      <option value="Travel">Travel</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Gender Required</label>
                  <div className="relative">
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none appearance-none focus:border-fuchsia-500/50 transition-colors"
                    >
                      <option value="Any">Any</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. UGC Video Shoot – Cosmetic Brand"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai / Delhi NCR / Goa"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe the casting call, event, or requirement in detail..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500/50 transition-colors resize-none"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Requirements (one per line)</label>
                <textarea
                  rows={3}
                  placeholder={"Age 18-24\nMust speak English\nSend 1 intro video"}
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500/50 transition-colors resize-none font-mono text-sm"
                />
              </div>

              {/* Age Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Min Age</label>
                  <input
                    type="number"
                    placeholder="18"
                    value={form.minAge}
                    onChange={(e) => setForm({ ...form, minAge: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Max Age</label>
                  <input
                    type="number"
                    placeholder="35"
                    value={form.maxAge}
                    onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Contact, Date, Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Info</label>
                  <input
                    type="text"
                    placeholder="WhatsApp / Email"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Date / Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 6-9 / This weekend"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Pay / Salary (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹33k/month + Stay & Food"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </p>
              )}

              <button
                onClick={handlePost}
                className="w-full h-14 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-5 h-5" /> Publish Listing Now
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── APPLY MODAL ───────────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#121217] border border-[#2b2b36] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
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
              <p className="text-gray-400 max-w-sm mx-auto">Your profile has been submitted. The casting team will contact you directly on WhatsApp or Email within 24-48 hours.</p>
              <button onClick={onClose} className="mt-4 px-8 py-3 rounded-xl bg-fuchsia-600 font-bold hover:bg-fuchsia-500 transition-colors">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              {listing.minAge && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-sm text-fuchsia-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Age requirement:</strong> {listing.minAge}{listing.maxAge ? `–${listing.maxAge}` : "+"} years
                    {listing.gender && listing.gender !== "Any" ? ` · ${listing.gender} only` : ""}
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
                    placeholder="Mumbai / Delhi / Goa"
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

              {/* Photo Upload */}
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

              {/* Intro Video Link */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Intro Video Link (Google Drive / Instagram Reel)</label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={form.introVideoLink}
                    onChange={(e) => setForm({ ...form, introVideoLink: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Short Message / Note</label>
                <textarea
                  rows={3}
                  placeholder="Tell them a bit about yourself, your experience, availability..."
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
                className="w-full h-14 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-2"
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

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export function LocalsClient() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<LocalListing[]>(ALL_LISTINGS);
  const [showAdminModal, setShowAdminModal] = useState(false);
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

      {/* Admin Post Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <AdminPostModal
            onClose={() => setShowAdminModal(false)}
            onPost={(l) => {
              setListings([l, ...listings]);
              setShowAdminModal(false);
            }}
          />
        )}
      </AnimatePresence>

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
            <button
              onClick={() => setShowAdminModal(true)}
              className="h-14 px-8 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(217,70,239,0.3)] shrink-0"
            >
              <Plus className="w-5 h-5" /> Post Requirement (Admin)
            </button>
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
