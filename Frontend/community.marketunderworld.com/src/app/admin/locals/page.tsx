"use client"

import { useState } from "react";
import { 
  MapPin, CheckCircle2, Trash2, Eye, EyeOff, Plus,
  Briefcase, Music, HeartHandshake, Plane, Users, Calendar, Search
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Simulated listing store (in production this would come from a DB/API)
const MOCK_LISTINGS = [
  {
    id: "cast-1",
    title: "CASTING CALL - UGC Video Shoot (Cosmetic Brand)",
    type: "Casting & Jobs",
    location: "Mumbai",
    postedBy: "Casting47",
    verified: true,
    active: true,
    applicants: 12,
    postedAt: "Today 12:36 PM",
    minAge: 18, maxAge: 24, gender: "Any",
  },
  {
    id: "cast-2",
    title: "Dermacy Films - Lead Female Artist (Urgent)",
    type: "Casting & Jobs",
    location: "Delhi NCR",
    postedBy: "Right Way Films",
    verified: true,
    active: true,
    applicants: 7,
    postedAt: "Yesterday",
    minAge: 25, maxAge: 32, gender: "Female",
  },
  {
    id: "dance-1",
    title: "DANCER BOYS & GIRLS Needed - Goa Shows",
    type: "Casting & Jobs",
    location: "Mumbai → Goa",
    postedBy: "DANCER BOYS (मुंबई)",
    verified: true,
    active: true,
    applicants: 34,
    postedAt: "Today 12:02 PM",
    minAge: 18, maxAge: 35, gender: "Any",
  },
  {
    id: "dance-2",
    title: "Jodhpur Wedding Shows - Girls Needed",
    type: "Events",
    location: "Jodhpur",
    postedBy: "Ankit",
    verified: false,
    active: false,
    applicants: 3,
    postedAt: "Today",
    minAge: 20, maxAge: 35, gender: "Female",
  },
];

const TYPE_ICONS: Record<string, any> = {
  "Casting & Jobs": Briefcase,
  "Events": Music,
  "Matchmaking": HeartHandshake,
  "Travel": Plane,
};

export default function AdminLocalsPage() {
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = listings.filter((l) => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
                        l.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" ? l.active : !l.active);
    return matchSearch && matchFilter;
  });

  const toggleActive = (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  const deleteListing = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const totalApplicants = listings.reduce((sum, l) => sum + l.applicants, 0);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-bold uppercase tracking-widest mb-2">
            <MapPin className="w-4 h-4" /> Locals Hub Admin
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Manage Listings</h1>
          <p className="text-gray-500 text-sm mt-1">All casting calls, events, and opportunities posted to the Locals Hub.</p>
        </div>
        <Link href="/admin/locals/new">
          <button className="flex items-center gap-2 h-12 px-6 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold transition-colors">
            <Plus className="w-5 h-5" /> Post New Listing
          </button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Listings", value: listings.length, color: "text-white" },
          { label: "Active", value: listings.filter(l => l.active).length, color: "text-green-400" },
          { label: "Inactive / Hidden", value: listings.filter(l => !l.active).length, color: "text-red-400" },
          { label: "Total Applicants", value: totalApplicants, color: "text-fuchsia-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{stat.label}</div>
            <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 outline-none focus:border-fuchsia-500/50 transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 h-12 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all capitalize",
                filter === f ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-4 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-widest">
          <div className="col-span-5">Listing</div>
          <div className="col-span-2 hidden md:block">Location</div>
          <div className="col-span-2 hidden md:block">Posted By</div>
          <div className="col-span-1 text-center">Apps</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500 text-sm">No listings found.</div>
        )}

        {filtered.map((listing) => {
          const Icon = TYPE_ICONS[listing.type] || Briefcase;
          return (
            <div key={listing.id} className={cn(
              "grid grid-cols-12 items-center px-6 py-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors",
              !listing.active && "opacity-50"
            )}>
              {/* Title col */}
              <div className="col-span-5 flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center",
                  listing.active ? "bg-fuchsia-500/10" : "bg-white/5"
                )}>
                  <Icon className={cn("w-5 h-5", listing.active ? "text-fuchsia-400" : "text-gray-500")} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white line-clamp-1">{listing.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{listing.type}</span>
                    {listing.verified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                    {listing.gender !== "Any" && (
                      <span className="text-[10px] font-bold text-blue-400">{listing.gender}</span>
                    )}
                    {listing.minAge && (
                      <span className="text-[10px] font-bold text-amber-400">
                        Age {listing.minAge}{listing.maxAge ? `–${listing.maxAge}` : "+"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-2 hidden md:flex items-center gap-1.5 text-sm text-gray-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>

              <div className="col-span-2 hidden md:flex items-center gap-1.5 text-sm text-gray-400">
                <span className="truncate">{listing.postedBy}</span>
              </div>

              <div className="col-span-1 text-center">
                <span className={cn(
                  "inline-flex items-center justify-center gap-1 text-xs font-bold rounded-lg px-2 py-1",
                  listing.applicants > 10 ? "bg-fuchsia-500/10 text-fuchsia-400" : "bg-white/5 text-gray-400"
                )}>
                  <Users className="w-3 h-3" /> {listing.applicants}
                </span>
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => toggleActive(listing.id)}
                  title={listing.active ? "Hide listing" : "Show listing"}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {listing.active ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                </button>
                <button
                  onClick={() => deleteListing(listing.id)}
                  title="Delete listing"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
