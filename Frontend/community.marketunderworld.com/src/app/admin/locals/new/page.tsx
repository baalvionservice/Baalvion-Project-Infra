"use client"

import { useState } from "react";
import { 
  Megaphone, Send, CheckCircle2, AlertCircle, ChevronDown, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ListingType = "Casting & Jobs" | "Events" | "Matchmaking" | "Travel";

export default function AdminLocalsNewPage() {
  const [form, setForm] = useState({
    title: "",
    type: "Casting & Jobs" as ListingType,
    location: "",
    description: "",
    requirements: "",
    contact: "",
    date: "",
    salary: "",
    minAge: "",
    maxAge: "",
    gender: "Any" as "Male" | "Female" | "Any",
    verified: true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handlePost = () => {
    if (!form.title || !form.location || !form.description) {
      setError("Title, Location, and Description are required.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
        <CheckCircle2 className="w-20 h-20 text-green-400" />
        <h2 className="text-3xl font-black text-white">Listing Published!</h2>
        <p className="text-gray-400 max-w-md">
          Your casting call is now live on the Locals Hub. Applicants can find it and apply directly through the website.
        </p>
        <div className="flex gap-4">
          <Link href="/locals">
            <button className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 font-bold transition-colors">
              View Live Page
            </button>
          </Link>
          <button
            onClick={() => { setSubmitted(false); setForm({ ...form, title: "", description: "", contact: "", date: "", salary: "" }); }}
            className="h-12 px-6 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 font-bold transition-colors"
          >
            Post Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <Link href="/admin/locals" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Manage Listings
        </Link>
        <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-widest mb-2">
          <Megaphone className="w-4 h-4" /> Post New Listing
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">New Casting Call / Event</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below. This will instantly appear on the public Locals Hub.</p>
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-8 space-y-6">
        {/* Type + Gender Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Listing Type *</label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ListingType })}
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
                <option value="Male">Male Only</option>
                <option value="Female">Female Only</option>
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
            placeholder="e.g. CASTING CALL - UGC Video Shoot (Cosmetic Brand)"
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
            placeholder="e.g. Mumbai / Delhi NCR / Goa / Jodhpur"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description *</label>
          <textarea
            rows={5}
            placeholder="Describe the casting call, event, or requirement in full detail. Include shoot/event details, project info, what you are looking for..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500/50 transition-colors resize-none"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Requirements <span className="text-gray-600 normal-case font-normal">(one per line)</span></label>
          <textarea
            rows={4}
            placeholder={"Must speak English fluently\nAge 18-24 GenZ\nSend 1 intro video + recent photos\nMust be available Oct 6-9"}
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500/50 transition-colors resize-none font-mono text-sm"
          />
        </div>

        {/* Age Range */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* Contact + Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contact Info</label>
            <input
              type="text"
              placeholder="WhatsApp number / Email"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Shoot Date / Duration</label>
            <input
              type="text"
              placeholder="e.g. Oct 6-9 / 6 Months from Nov"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Salary */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Pay / Salary <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. ₹33k/month + Stay & Food / ₹3000/night"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 outline-none focus:border-fuchsia-500/50 transition-colors"
          />
        </div>

        {/* Verified toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <div>
            <div className="font-bold text-sm text-white">Mark as Verified Listing</div>
            <div className="text-xs text-gray-500 mt-0.5">Verified listings show a green ✓ badge and appear more trustworthy to applicants.</div>
          </div>
          <button
            onClick={() => setForm({ ...form, verified: !form.verified })}
            className={cn(
              "w-12 h-6 rounded-full border-2 transition-colors relative",
              form.verified ? "bg-green-500 border-green-500" : "bg-white/10 border-white/20"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
              form.verified ? "left-6" : "left-0.5"
            )} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}

        <button
          onClick={handlePost}
          className="w-full h-14 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(217,70,239,0.3)]"
        >
          <Send className="w-5 h-5" /> Publish to Locals Hub
        </button>
      </div>
    </div>
  );
}
