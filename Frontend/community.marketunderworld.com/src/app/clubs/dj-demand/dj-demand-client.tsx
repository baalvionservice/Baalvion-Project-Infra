"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import {
  Music, MapPin, Users, TrendingUp, CheckCircle, Clock,
  ArrowRight, Zap, Send
} from "lucide-react";
import { DJ_DEMANDS, type DjDemand } from "@/data/celebrity-events";
import { INDIAN_NIGHTLIFE_STATES } from "@/data/clubs-data";
import { cn } from "@/lib/utils";

// ─── Cities per state ─────────────────────────────────────────────────────────
const STATE_CITIES: Record<string, string[]> = {
  "Maharashtra":   ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Delhi (NCT)":  ["Delhi", "New Delhi", "South Delhi"],
  "Delhi NCR":    ["Gurgaon", "Noida", "Faridabad", "Ghaziabad"],
  "Karnataka":    ["Bangalore", "Mysore", "Hubli"],
  "Goa":          ["North Goa", "South Goa", "Panjim", "Margao"],
  "Telangana":    ["Hyderabad", "Secunderabad", "Warangal"],
  "Punjab":       ["Chandigarh", "Ludhiana", "Amritsar", "Mohali"],
  "West Bengal":  ["Kolkata", "Howrah", "Siliguri"],
  "Tamil Nadu":   ["Chennai", "Coimbatore", "Madurai"],
  "Rajasthan":    ["Jaipur", "Udaipur", "Jodhpur", "Kota"],
};

import { admin } from "@/lib/api/nightlife";

const DJ_SUGGESTIONS = [
  "DJ Snake", "DJ Nucleya", "Martin Garrix", "Armin van Buuren", "Hardwell",
  "Tiësto", "KSHMR", "Badshah", "DJ Chetas", "Lost Stories", "Ritviz",
  "Sunburn DJ", "Jaaved Jaaferi", "DJ Suketu", "DJ Lloyd", "Ash Roy"
];

// ─── Component ────────────────────────────────────────────────────────────────
export function DjDemandClient() {
  const { isAuthenticated, isLoading } = useAuth();
  const [demands, setDemands] = useState<DjDemand[]>([]);
  // pledged[id] = amount the user pledged for that demand (persisted locally just for UI session if needed)
  const [pledged, setPledged] = useState<Record<string, number>>({});
  const [loadingDemands, setLoadingDemands] = useState(true);

  // Load demands
  useEffect(() => {
    admin.djDemands().then(res => {
      setDemands(res.items.length > 0 ? res.items : DJ_DEMANDS);
      setLoadingDemands(false);
    }).catch(() => {
      setDemands(DJ_DEMANDS);
      setLoadingDemands(false);
    });
  }, []);

  // ── New demand form ────────────────────────────────────────────────────────
  const [formState, setFormState] = useState<"idle" | "submitted">("idle");
  const [artistName, setArtistName] = useState("");
  const [pubName, setPubName] = useState("");
  const [selectedState, setSelectedState] = useState(INDIAN_NIGHTLIFE_STATES[0]);
  const [selectedCity, setSelectedCity] = useState("");
  const [pledgeAmount, setPledgeAmount] = useState(500);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSuggestions = DJ_SUGGESTIONS.filter(
    s => artistName.length > 1 && s.toLowerCase().includes(artistName.toLowerCase())
  );

  // ── Per-card pledge UI ────────────────────────────────────────────────────
  const [pledgingId, setPledgingId] = useState<string | null>(null);
  const [pledgeInputAmount, setPledgeInputAmount] = useState(500);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [stateFilter, setStateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "confirmed">("all");

  const citiesForState = STATE_CITIES[selectedState] ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmitDemand = async () => {
    if (!artistName.trim()) { setFormError("Please enter an artist or DJ name."); return; }
    if (!pubName.trim()) { setFormError("Please enter the pub / venue name."); return; }
    if (!selectedCity) { setFormError("Please select a city."); return; }
    setFormError("");
    setIsSubmitting(true);
    try {
      const newDemand = {
        djName: artistName.trim(),
        djImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop",
        genre: "To be confirmed",
        requestedBy: 1,
        totalBidAmount: pledgeAmount,
        clubName: pubName.trim(),
        city: selectedCity,
        state: selectedState,
        status: "open",
        targetAmount: 500000,
        demandDeadline: new Date(Date.now() + 60 * 86400000).toISOString(),
      };
      const created = await admin.createDjDemand(newDemand);
      setDemands([created, ...demands]);
      setPledged({ ...pledged, [created.id]: pledgeAmount });
      setFormState("submitted");
      setArtistName("");
      setPubName("");
      setPledgeAmount(500);
    } catch {
      setFormError("Failed to submit demand. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePledge = async (id: string, amount: number) => {
    try {
      await admin.pledgeDjDemand(id, amount);
      const newDemands = demands.map(d => {
        if (d.id !== id) return d;
        const newTotal = d.totalBidAmount + amount;
        return { ...d, totalBidAmount: newTotal, requestedBy: d.requestedBy + 1, status: newTotal >= d.targetAmount ? "confirmed" : d.status } as DjDemand;
      });
      setDemands(newDemands);
      setPledged({ ...pledged, [id]: amount });
      setPledgingId(null);
    } catch {
      alert("Failed to pledge. Try again.");
    }
  };

  const filtered = demands.filter(d => {
    const matchState = stateFilter === "All" || d.state === stateFilter;
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchState && matchStatus;
  });

  const breadcrumbItems = [
    { label: "Clubs", href: "/clubs" },
    { label: "Demand a DJ / Artist" },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans">
      <Navbar />
      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* ── Hero + Inline Demand Form ─────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-[#0a0a1a] via-[#12052a] to-[#0a1a0a] text-white rounded-2xl p-6 md:p-10 mb-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/25 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full mb-5">
              <Music className="w-3.5 h-3.5" />
              Public Demand · Collective Bidding
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
              You Choose the Artist. We Book the Night.
            </h1>
            <p className="text-gray-300 text-base mb-8 leading-relaxed">
              Tell us exactly which DJ or celebrity you want, at which pub, in which city. Pool pledges with other fans — when the target is reached, we book the artist.
            </p>

            {formState === "submitted" ? (
              <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg text-green-300 mb-1">Demand Submitted! 🎉</p>
                  <p className="text-green-400/80 text-sm">Your demand has been added to the public list. Share it to get more pledges!</p>
                </div>
                <button onClick={() => setFormState("idle")} className="ml-auto text-sm text-green-400 hover:text-green-300 underline">Submit another</button>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
                <p className="text-white font-bold text-lg mb-1">I want{" "}
                  <span className="text-purple-400">[Artist]</span> at{" "}
                  <span className="text-amber-400">[Pub]</span> in{" "}
                  <span className="text-green-400">[City]</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Artist name with autocomplete */}
                  <div className="relative md:col-span-1">
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
                      <Music className="w-3.5 h-3.5 inline mr-1 text-purple-400" />Artist / DJ Name *
                    </label>
                    <input
                      value={artistName}
                      onChange={e => { setArtistName(e.target.value); setShowSuggestions(true); setFormError(""); }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="e.g. DJ Snake, Badshah..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-400 placeholder-white/30 transition-colors"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/20 rounded-xl overflow-hidden z-20 shadow-xl">
                        {filteredSuggestions.map(s => (
                          <button key={s} onMouseDown={() => { setArtistName(s); setShowSuggestions(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-purple-500/20 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pub name */}
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 inline mr-1 text-amber-400" />Pub / Venue Name *
                    </label>
                    <input
                      value={pubName}
                      onChange={e => { setPubName(e.target.value); setFormError(""); }}
                      placeholder="e.g. Kitty Su, Privee..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-400 placeholder-white/30 transition-colors"
                    />
                  </div>

                  {/* State → City */}
                  <div className="md:col-span-1 space-y-2">
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">City *</label>
                    <select
                      value={selectedState}
                      onChange={e => { setSelectedState(e.target.value); setSelectedCity(""); setFormError(""); }}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-green-400 transition-colors"
                    >
                      {INDIAN_NIGHTLIFE_STATES.map(s => <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>)}
                    </select>
                    <select
                      value={selectedCity}
                      onChange={e => { setSelectedCity(e.target.value); setFormError(""); }}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-green-400 transition-colors"
                    >
                      <option value="" className="bg-[#1a1a2e]">Select city...</option>
                      {citiesForState.map(c => <option key={c} value={c} className="bg-[#1a1a2e]">{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Pledge amount */}
                <div className="flex flex-wrap items-end gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">My Pledge (₹)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-bold">₹</span>
                      <input
                        type="number" min={100} step={100} value={pledgeAmount}
                        onChange={e => setPledgeAmount(Number(e.target.value))}
                        className="w-28 bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pb-0.5">
                    {[500, 1000, 2000, 5000].map(amt => (
                      <button key={amt} onClick={() => setPledgeAmount(amt)}
                        className={cn("px-3 py-2.5 rounded-xl text-xs font-bold border transition-all",
                          pledgeAmount === amt ? "bg-purple-600 border-purple-600 text-white" : "border-white/20 text-gray-400 hover:border-purple-400 hover:text-white"
                        )}>
                        ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-red-400 text-sm font-semibold flex items-center gap-2">⚠️ {formError}</p>
                )}

                {!isAuthenticated && !isLoading ? (
                  <Link href={`/auth/signin?redirect=${encodeURIComponent('/clubs/dj-demand')}`}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-base shadow-lg">
                    Sign in to Submit
                  </Link>
                ) : (
                  <button
                    onClick={handleSubmitDemand}
                    disabled={isSubmitting}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base shadow-lg shadow-purple-900/40"
                  >
                    <Send className="w-5 h-5" />
                    {isSubmitting ? "Submitting..." : `Submit Demand + Pledge ₹${pledgeAmount.toLocaleString("en-IN")}`}
                  </button>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Your pledge is only collected if the target is reached. Refunded otherwise.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Music, title: "Name the artist", desc: "Pick any DJ or celebrity you want at a specific pub.", color: "text-purple-500 bg-purple-50" },
            { icon: MapPin, title: "Pick city & pub", desc: "Choose your city and the exact venue name.", color: "text-amber-500 bg-amber-50" },
            { icon: TrendingUp, title: "Pool pledges", desc: "Others join and pledge money. Target unlocks the event.", color: "text-green-500 bg-green-50" },
            { icon: CheckCircle, title: "Event confirmed", desc: "Target hit → we contact the artist and confirm the date.", color: "text-blue-500 bg-blue-50" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", ...INDIAN_NIGHTLIFE_STATES].map(s => (
              <button key={s} onClick={() => setStateFilter(s)}
                className={cn("px-4 py-2 rounded-full text-sm font-bold border transition-all",
                  stateFilter === s ? "bg-[#222] text-white border-[#222]" : "bg-white text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600"
                )}>
                {s === "All" ? "All States" : s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["all", "open", "confirmed"] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn("px-4 py-2 rounded-full text-xs font-bold border capitalize transition-all",
                  statusFilter === f ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200"
                )}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Demand cards ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {filtered.map(demand => {
            const pct = Math.min(100, Math.round((demand.totalBidAmount / demand.targetAmount) * 100));
            const daysLeft = Math.max(0, Math.ceil((new Date(demand.demandDeadline).getTime() - Date.now()) / 86400000));
            const isPledgingThis = pledgingId === demand.id;
            const myPledge = pledged[demand.id]; // amount I pledged (persisted)

            return (
              <div key={demand.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={demand.djImage} alt={demand.djName}
                      className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-gray-100" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{demand.djName}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{demand.genre}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">at</span>
                            <span className="font-bold text-gray-800">{demand.clubName}</span>
                            <span className="text-gray-400">in</span>
                            <span className="flex items-center gap-1 text-[#ed6c2a] font-bold">
                              <MapPin className="w-3.5 h-3.5" />{demand.city}, {demand.state}
                            </span>
                          </div>
                        </div>
                        <span className={cn("text-xs font-bold px-3 py-1 rounded-full border",
                          demand.status === "confirmed"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        )}>
                          {demand.status === "confirmed" ? "✓ EVENT CONFIRMED" : "OPEN FOR PLEDGES"}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-6 mb-4 text-sm">
                        {[
                          { label: "Pledged", value: `₹${demand.totalBidAmount.toLocaleString("en-IN")}`, color: "text-purple-700" },
                          { label: "Target", value: `₹${demand.targetAmount.toLocaleString("en-IN")}`, color: "text-gray-900" },
                          { label: "Supporters", value: demand.requestedBy.toLocaleString(), icon: <Users className="w-3.5 h-3.5 text-purple-500" />, color: "text-gray-900" },
                          { label: "Deadline", value: `${daysLeft}d left`, icon: <Clock className="w-3.5 h-3.5 text-[#ed6c2a]" />, color: daysLeft < 7 ? "text-red-500" : "text-gray-900" },
                        ].map(s => (
                          <div key={s.label}>
                            <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
                            <p className={cn("font-bold flex items-center gap-1", s.color)}>
                              {s.icon}{s.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                          <span className="font-bold text-purple-600">{pct}% funded</span>
                          <span>₹{(demand.targetAmount - demand.totalBidAmount).toLocaleString("en-IN")} to go</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700",
                              demand.status === "confirmed" ? "bg-green-500" : pct > 60 ? "bg-purple-500" : "bg-purple-400"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Pledge CTA */}
                      {demand.status !== "confirmed" && !myPledge ? (
                        !isAuthenticated && !isLoading ? (
                          <Link href={`/auth/signin?redirect=${encodeURIComponent('/clubs/dj-demand')}`}
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-full transition-all text-sm">
                            <Zap className="w-4 h-4" /> Sign in to Pledge
                          </Link>
                        ) : !isPledgingThis ? (
                          <button onClick={() => { setPledgingId(demand.id); setPledgeInputAmount(500); }}
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-full transition-all text-sm">
                            <Zap className="w-4 h-4" /> Pledge to Demand
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-700">₹</span>
                              <input type="number" min={100} step={100} value={pledgeInputAmount}
                                onChange={e => setPledgeInputAmount(Number(e.target.value))}
                                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500" />
                            </div>
                            <div className="flex gap-1.5">
                              {[500, 1000, 2000].map(amt => (
                                <button key={amt} onClick={() => setPledgeInputAmount(amt)}
                                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                    pledgeInputAmount === amt ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-600"
                                  )}>
                                  ₹{amt.toLocaleString()}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => handlePledge(demand.id, pledgeInputAmount)}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> Confirm Pledge
                            </button>
                            <button onClick={() => setPledgingId(null)} className="text-gray-400 text-sm hover:text-gray-600">Cancel</button>
                          </div>
                        )
                      ) : myPledge ? (
                        // ← Fixed: shows the actual pledged amount from persisted state
                        <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                          <CheckCircle className="w-4 h-4" /> You pledged ₹{myPledge.toLocaleString("en-IN")} — thank you! Saved across sessions.
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl text-sm font-bold">
                          <CheckCircle className="w-5 h-5" /> 🎉 Target reached! Event confirmed. Stay tuned for the date.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Link to events */}
        <div className="mt-10 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
          <p className="text-gray-600 mb-3">Want to book tickets for already-confirmed celebrity events?</p>
          <Link href="/clubs/events"
            className="inline-flex items-center gap-2 bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold px-6 py-3 rounded-full transition-all">
            Browse Upcoming Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
