"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Heart, 
  X, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle, 
  Flame,
  Star,
  Building,
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  SlidersHorizontal,
  Grid,
  Layers,
  Award,
  TrendingUp,
  UserPlus,
  Zap,
  Globe,
  Plus
} from "lucide-react";
import { createNewTrade } from "@/lib/escrow-store";

interface FounderProfile {
  id: string;
  name: string;
  age: number;
  companyName: string;
  sector: "AI" | "Web3" | "FinTech" | "SaaS" | "Biotech" | "Consumer";
  role: string;
  valuation: string;
  hourlyRateUsdt: number;
  hourlyRateInr: number;
  location: string;
  bio: string;
  interests: string[];
  verifiedFounder: boolean;
  avatarUrl: string;
  availability: string;
  rating: number;
  completedDates: number;
  upiId: string;
}

const FOUNDERS_DATABASE: FounderProfile[] = [
  {
    id: "fnd-1",
    name: "Vikram Singhania",
    age: 29,
    companyName: "Nexus AI Protocol",
    sector: "AI",
    role: "Founder & CEO",
    valuation: "$25M",
    hourlyRateUsdt: 200,
    hourlyRateInr: 18000,
    location: "Mumbai / BKC VIP Node",
    bio: "AI Researcher & Founder. Looking for intelligent date companions for high-end networking dinners, rooftop sessions, and tech Galas.",
    interests: ["Artificial Intelligence", "Yachting", "Luxury Dining", "Venture Capital"],
    verifiedFounder: true,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    availability: "Available Weekend Evenings",
    rating: 4.9,
    completedDates: 38,
    upiId: "vikram.nexus@icici"
  },
  {
    id: "fnd-2",
    name: "Marcus Vance",
    age: 31,
    companyName: "Underworld Pay",
    sector: "FinTech",
    role: "Co-Founder & CTO",
    valuation: "$18M",
    hourlyRateUsdt: 150,
    hourlyRateInr: 13500,
    location: "Bangalore / Indiranagar",
    bio: "FinTech founder building decentralized payments. Rent me for casual coffee dates, startup feedback, or VIP nightlife events.",
    interests: ["FinTech", "EDM Festivals", "Cocktail Mixology", "Fast Cars"],
    verifiedFounder: true,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    availability: "Available Weekday Nights",
    rating: 5.0,
    completedDates: 54,
    upiId: "marcus.pay@okaxis"
  },
  {
    id: "fnd-3",
    name: "Rahul Kapoor",
    age: 28,
    companyName: "Aether Web3 Labs",
    sector: "Web3",
    role: "Founder & Managing Director",
    valuation: "$40M",
    hourlyRateUsdt: 300,
    hourlyRateInr: 27000,
    location: "Delhi NCR / Aerocity VIP",
    bio: "Web3 ecosystem architect & angel investor. Available to be rented for exclusive 5-star dinner dates and private lounge sessions.",
    interests: ["Web3 Architecture", "Angel Investing", "Fine Wines", "Golf"],
    verifiedFounder: true,
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
    availability: "Available Any Evening",
    rating: 4.9,
    completedDates: 42,
    upiId: "rahul.aether@paytm"
  },
  {
    id: "fnd-4",
    name: "Devina Roy",
    age: 27,
    companyName: "BioGen HealthTech",
    sector: "Biotech",
    role: "Founder & Lead Geneticist",
    valuation: "$15M",
    hourlyRateUsdt: 180,
    hourlyRateInr: 16200,
    location: "Hyderabad Hub",
    bio: "Biotech founder pioneering longevity science. Looking to connect for dinner discussions on longevity, healthtech, and art.",
    interests: ["Longevity Science", "HealthTech", "Modern Art", "Violin"],
    verifiedFounder: true,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    availability: "Available Weekends",
    rating: 4.8,
    completedDates: 29,
    upiId: "devina.biogen@icici"
  },
  {
    id: "fnd-5",
    name: "Karan Mehta",
    age: 32,
    companyName: "CloudScale SaaS",
    sector: "SaaS",
    role: "Founder & CEO",
    valuation: "$60M",
    hourlyRateUsdt: 250,
    hourlyRateInr: 22500,
    location: "Bangalore / Koramangala",
    bio: "B2B SaaS founder with 3 successful exits. Rent me for pitch feedback, luxury dining, or private club networking.",
    interests: ["SaaS Growth", "Exits", "Private Aviation", "Polo"],
    verifiedFounder: true,
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80",
    availability: "Available Late Nights",
    rating: 5.0,
    completedDates: 67,
    upiId: "karan.cloudscale@hdfc"
  },
  {
    id: "fnd-6",
    name: "Natasha Malhotra",
    age: 26,
    companyName: "Vogue Consumer Labs",
    sector: "Consumer",
    role: "Founder & Creative Director",
    valuation: "$12M",
    hourlyRateUsdt: 140,
    hourlyRateInr: 12600,
    location: "Mumbai / Bandra VIP",
    bio: "D2C luxury brand founder. Available for high-fashion Gala dates, launch parties, and creative brand strategy sessions.",
    interests: ["Fashion Tech", "Luxury Brands", "Photography", "Champagne"],
    verifiedFounder: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    availability: "Available Weekend Evenings",
    rating: 4.9,
    completedDates: 31,
    upiId: "natasha.vogue@axis"
  }
];

export default function ScalingDatingPlatformPage() {
  const [viewMode, setViewMode] = useState<"deck" | "grid" | "leaderboard">("grid");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Swipe Deck State
  const [currentIndex, setCurrentIndex] = useState(0);

  // Booking Modal State
  const [selectedFounder, setSelectedFounder] = useState<FounderProfile | null>(null);
  const [sessionType, setSessionType] = useState<"dinner" | "coffee" | "vip_party" | "advisory">("dinner");
  const [hours, setHours] = useState<number>(2);
  const [paymentMethod, setPaymentMethod] = useState<"phonepe" | "gpay" | "usdt">("phonepe");
  const [rentedFounders, setRentedFounders] = useState<FounderProfile[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Apply as Founder Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: "", company: "", valuation: "", hourlyRate: 200, bio: "" });

  const filteredFounders = FOUNDERS_DATABASE.filter((f) => {
    const matchesSector = selectedSector === "all" || f.sector === selectedSector;
    const matchesSearch = 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  const currentDeckFounder = filteredFounders[currentIndex] || filteredFounders[0];

  const handleNextDeck = () => {
    if (currentIndex < filteredFounders.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleConfirmRental = () => {
    if (!selectedFounder) return;

    const totalUsdt = selectedFounder.hourlyRateUsdt * hours;
    createNewTrade({
      memberId: selectedFounder.id,
      memberName: `${selectedFounder.name} (${selectedFounder.companyName})`,
      serviceType: "crypto_trade",
      amount: totalUsdt,
      paymentMethod: paymentMethod === 'usdt' ? 'USDT' : paymentMethod,
      instructions: `FOUNDER DATE BOOKING: ${sessionType.toUpperCase()} with ${selectedFounder.name} for ${hours} hours ($${totalUsdt} USDT held in Escrow)`
    });

    setRentedFounders((prev) => [...prev, selectedFounder]);
    setBookingSuccess(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-white min-h-screen space-y-8">
      
      {/* Platform Banner Header */}
      <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-rose-950 text-rose-400 border border-rose-800/80 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Rent A Founder • 100+ Verified CEOs & Co-Founders
              </span>
              <span className="bg-amber-950 text-amber-400 border border-amber-800/80 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                $10M - $60M Valuations
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Founder Dating & Executive Escort Marketplace
            </h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
              Browse 100+ verified startup founders, AI researchers, and Web3 CEOs. Book 1-on-1 dinner dates, VIP club tables, or advisory sessions backed by <strong>$1,000 USDT Escrow Protection</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowApplyModal(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-2 border border-zinc-700"
            >
              <UserPlus className="w-4 h-4 text-amber-400" /> Apply to List as Founder
            </button>

            <Link
              href="/escrow/my-trades"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-xl shadow-red-950/40"
            >
              <Calendar className="w-4 h-4" /> My Bookings ({rentedFounders.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Sector Filters, and View Switcher */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 100+ founders by name or startup..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-red-500 font-sans"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto no-scrollbar py-1">
          {["all", "AI", "Web3", "FinTech", "SaaS", "Biotech", "Consumer"].map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
                selectedSector === sec 
                  ? "bg-red-600 text-white shadow-lg shadow-red-950/50" 
                  : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white"
              }`}
            >
              {sec === "all" ? "All 100+ Founders" : sec}
            </button>
          ))}
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
            title="Grid View Directory"
          >
            <Grid className="w-4 h-4" /> Grid
          </button>
          <button
            onClick={() => setViewMode("deck")}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "deck" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
            title="Tinder Swipe Deck"
          >
            <Layers className="w-4 h-4" /> Swipe Deck
          </button>
          <button
            onClick={() => setViewMode("leaderboard")}
            className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "leaderboard" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
            title="Top Rated Founders Leaderboard"
          >
            <Award className="w-4 h-4 text-amber-400" /> Leaderboard
          </button>
        </div>
      </div>

      {/* VIEW 1: DIRECTORY GRID MODE (100+ Founders Scalable Grid) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFounders.map((founder) => (
            <div key={founder.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all flex flex-col justify-between group shadow-xl">
              
              {/* Photo & Valuation Overlay */}
              <div className="relative h-64 w-full bg-zinc-950 overflow-hidden">
                <img 
                  src={founder.avatarUrl} 
                  alt={founder.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/30"></div>

                <div className="absolute top-3 left-3 bg-amber-950/90 backdrop-blur-md border border-amber-500/60 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {founder.sector} • {founder.valuation}
                </div>

                <div className="absolute top-3 right-3 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/60 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-xl font-bold text-white drop-shadow">{founder.name}, {founder.age}</h3>
                  <p className="text-xs text-rose-400 font-semibold">{founder.role} @ {founder.companyName}</p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-zinc-300 line-clamp-2 italic bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
                  "{founder.bio}"
                </p>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-zinc-800/60 font-mono">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Hourly Rate</div>
                    <div className="text-sm font-bold text-emerald-400">${founder.hourlyRateUsdt} USDT <span className="text-xs text-zinc-400 font-normal">/ hr</span></div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-zinc-500 uppercase">Rating</div>
                    <div className="text-sm font-bold text-white flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {founder.rating} ({founder.completedDates})
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => { setSelectedFounder(founder); setBookingSuccess(false); }}
                  className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Rent Founder for Date
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: SWIPE DECK MODE */}
      {viewMode === "deck" && (
        <div className="flex flex-col items-center justify-center py-6">
          {currentDeckFounder ? (
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="relative h-96 w-full bg-zinc-950">
                <img src={currentDeckFounder.avatarUrl} alt={currentDeckFounder.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white">{currentDeckFounder.name}, {currentDeckFounder.age}</h2>
                  <p className="text-sm font-semibold text-rose-400">{currentDeckFounder.role} @ {currentDeckFounder.companyName}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-zinc-300 italic">"{currentDeckFounder.bio}"</p>
                <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs font-mono">
                  <span className="text-zinc-400">Rate: <strong className="text-emerald-400">${currentDeckFounder.hourlyRateUsdt} USDT/hr</strong></span>
                  <span className="text-zinc-400">Rating: <strong className="text-amber-400">★ {currentDeckFounder.rating}</strong></span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleNextDeck} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-3 rounded-xl text-xs flex-1">Next</button>
                  <button onClick={() => { setSelectedFounder(currentDeckFounder); setBookingSuccess(false); }} className="bg-rose-600 text-white font-bold px-4 py-3 rounded-xl text-xs flex-1">Rent Now</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* VIEW 3: LEADERBOARD MODE */}
      {viewMode === "leaderboard" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Top Rated Founders Leaderboard
            </h2>
            <p className="text-xs text-zinc-400">Ranked by completed date sessions & client satisfaction rating.</p>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-zinc-400 text-xs uppercase font-mono border-b border-zinc-800">
                <th className="p-4">Rank</th>
                <th className="p-4">Founder</th>
                <th className="p-4">Company & Sector</th>
                <th className="p-4">Hourly Rate</th>
                <th className="p-4">Dates Completed</th>
                <th className="p-4">Rating</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {FOUNDERS_DATABASE.map((f, i) => (
                <tr key={f.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/40 text-xs">
                  <td className="p-4 font-bold text-amber-400 font-mono">#{i + 1}</td>
                  <td className="p-4 font-bold text-white flex items-center gap-3">
                    <img src={f.avatarUrl} alt={f.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
                    {f.name}
                  </td>
                  <td className="p-4 text-zinc-300">{f.companyName} <span className="text-[10px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono ml-1">{f.sector}</span></td>
                  <td className="p-4 font-bold text-emerald-400 font-mono">${f.hourlyRateUsdt} USDT</td>
                  <td className="p-4 font-mono text-zinc-300">{f.completedDates} sessions</td>
                  <td className="p-4 font-bold text-amber-400 font-mono">★ {f.rating}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => { setSelectedFounder(f); setBookingSuccess(false); }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors text-xs"
                    >
                      Rent Founder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Modal */}
      {selectedFounder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 text-white relative">
            <button onClick={() => setSelectedFounder(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {!bookingSuccess ? (
              <>
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" /> Rent {selectedFounder.name}
                </h2>
                <p className="text-xs text-zinc-400 mb-6">
                  {selectedFounder.role} at <strong className="text-white">{selectedFounder.companyName}</strong>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 font-semibold mb-1">Select Date Session Type</label>
                    <select 
                      value={sessionType}
                      onChange={(e: any) => setSessionType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="dinner">VIP 5-Star Dinner Date & Conversation</option>
                      <option value="coffee">Coffee & Startup Pitch Mentorship</option>
                      <option value="vip_party">VIP Nightclub Lounge Escort & Party</option>
                      <option value="advisory">1-on-1 Advisory Board Session</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 font-semibold mb-1">Select Duration (Hours)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={8}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Hourly Rate</span>
                      <span className="font-mono text-white">${selectedFounder.hourlyRateUsdt} USDT / hr</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-zinc-800 pt-2">
                      <span className="text-zinc-300">Total Escrow Booking Fee ({hours} hrs)</span>
                      <span className="font-mono text-emerald-400">${selectedFounder.hourlyRateUsdt * hours} USDT (≈ ₹{(selectedFounder.hourlyRateInr * hours).toLocaleString()} INR)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 font-semibold mb-1">Payment Channel (Escrow Protected)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("phonepe")}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          paymentMethod === "phonepe" ? "bg-purple-950 border-purple-500 text-purple-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        PhonePe
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("gpay")}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          paymentMethod === "gpay" ? "bg-blue-950 border-blue-500 text-blue-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        GPay
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("usdt")}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          paymentMethod === "usdt" ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        USDT Direct
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmRental}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950/40"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm Escrow Booking
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-white">Date Session Booked & Escrow Secured!</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your booking request for <strong className="text-white">{selectedFounder.name}</strong> has been created. Total fee of <strong className="text-emerald-400">${selectedFounder.hourlyRateUsdt * hours} USDT</strong> is safely locked in platform Escrow.
                </p>
                <Link
                  href="/escrow/my-trades"
                  className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-xl transition-colors text-xs"
                >
                  View Booking in Workspace
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply to be Listed as Founder Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-white relative">
            <button onClick={() => setShowApplyModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" /> Founder Listing Application
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Are you a startup CEO / Web3 Founder? Apply to list yourself on the 100+ Founder Marketplace.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Alex Mercer" 
                  value={applyForm.name}
                  onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Company / Startup Name & Valuation</label>
                <input 
                  type="text" 
                  placeholder="e.g. CyberNode ($15M Valuation)" 
                  value={applyForm.company}
                  onChange={(e) => setApplyForm({ ...applyForm, company: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Hourly Rental Rate (USDT)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 200" 
                  value={applyForm.hourlyRate}
                  onChange={(e) => setApplyForm({ ...applyForm, hourlyRate: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Short Founder Bio</label>
                <textarea 
                  rows={2} 
                  placeholder="Tell clients about your startup, achievements & dating interests..." 
                  value={applyForm.bio}
                  onChange={(e) => setApplyForm({ ...applyForm, bio: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <button
                onClick={() => { alert("Application submitted! Admin will verify your $1,000 deposit & startup credentials."); setShowApplyModal(false); }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors text-xs"
              >
                Submit Founder Application
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
