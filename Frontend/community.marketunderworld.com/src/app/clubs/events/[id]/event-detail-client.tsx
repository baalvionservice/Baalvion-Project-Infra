"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  MapPin, Clock, CalendarDays, Ticket, Gavel, Star,
  CheckCircle, AlertCircle, ChevronRight, Trophy, ArrowLeft, TrendingUp, Plus
} from "lucide-react";
import { type CelebrityEvent, type AuctionBid } from "@/data/celebrity-events";
import { cn } from "@/lib/utils";

interface Props { event: CelebrityEvent }

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function useCountdown(iso: string) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date(iso).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return setT({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return t;
}

// ─── Pulse animation for new top bid ─────────────────────────────────────────
function BidFlash({ children }: { children: React.ReactNode }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [children]);
  return (
    <span className={cn("transition-all duration-300", flash && "text-green-400 scale-110 inline-block")}>
      {children}
    </span>
  );
}

export function EventDetailClient({ event }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "auction">("overview");

  // ── Ticket booking state ───────────────────────────────────────────────────
  const [ticketQty, setTicketQty] = useState(1);
  const [ticketStep, setTicketStep] = useState<"select" | "details" | "confirm">("select");
  const [ticketBooked, setTicketBooked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [form, setForm] = useState({ name: "", email: user?.email || "", phone: "" });
  const [localTicketsSold, setLocalTicketsSold] = useState(event.standardTicketsSold);

  // ── Auction state (fully local — accumulates all bids) ────────────────────
  const [liveBids, setLiveBids] = useState<AuctionBid[]>(event.auctionBids);
  const [bidAmount, setBidAmount] = useState(
    Math.max(event.auctionCurrentBid, event.auctionMinBid) + 500
  );
  const [myLastBid, setMyLastBid] = useState<number | null>(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidError, setBidError] = useState("");

  const topBid = liveBids.length > 0 ? Math.max(...liveBids.map(b => b.amount)) : event.auctionMinBid;
  const totalBidPool = liveBids.reduce((s, b) => s + b.amount, 0);

  // Winning threshold: top N bids (N = auctionSeats)
  const sortedBids = [...liveBids].sort((a, b) => b.amount - a.amount);
  const winningBids = sortedBids.slice(0, event.auctionSeats);
  const lowestWinningBid = winningBids.length >= event.auctionSeats 
    ? winningBids[winningBids.length - 1].amount 
    : event.auctionMinBid;
  const emptyAuctionSeats = Math.max(0, event.auctionSeats - liveBids.length);

  const auctionCountdown = useCountdown(
    event.auctionEndTime || new Date(Date.now() + 86400000 * 14).toISOString()
  );

  const soldPct = Math.round((localTicketsSold / event.standardTicketsTotal) * 100);
  const remaining = event.standardTicketsTotal - localTicketsSold;
  const soldOut = remaining <= 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBookTicket = () => {
    if (ticketStep === "select") { setTicketStep("details"); return; }
    if (ticketStep === "details") { setTicketStep("confirm"); return; }
    setIsBooking(true);
    setTimeout(() => { 
      setIsBooking(false); 
      setTicketBooked(true); 
      setLocalTicketsSold(prev => prev + ticketQty);
    }, 1500);
  };

  const handlePlaceBid = () => {
    setBidError("");
    const minRequired = Math.max(event.auctionMinBid, topBid + 500);
    if (bidAmount < event.auctionMinBid) {
      setBidError(`Minimum bid is ₹${event.auctionMinBid.toLocaleString("en-IN")}`);
      return;
    }
    if (bidAmount <= topBid) {
      setBidError(`Your bid must be higher than the current top bid of ₹${topBid.toLocaleString("en-IN")}. Try ₹${minRequired.toLocaleString("en-IN")} or more.`);
      setBidAmount(minRequired);
      return;
    }
    setIsPlacingBid(true);
    setTimeout(() => {
      const newBid: AuctionBid = {
        id: `b-live-${Date.now()}`,
        bidderName: "You (User ***000)",
        amount: bidAmount,
        placedAt: new Date().toISOString(),
      };
      setLiveBids(prev => [newBid, ...prev]);
      setMyLastBid(bidAmount);
      setBidAmount(bidAmount + 500); // suggest next increment
      setIsPlacingBid(false);
    }, 1000);
  };


  const isMyBidWinning = myLastBid !== null && myLastBid >= lowestWinningBid;

  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[360px] mt-20 overflow-hidden">
        <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-[1200px] mx-auto px-4 pb-8">
          <Link href="/clubs/events" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <img src={event.celebrityImage} alt={event.celebrity}
              className="w-24 h-24 rounded-2xl border-2 border-white/40 object-cover shadow-xl" />
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
                {event.type === "celebrity_appearance" ? "Celebrity Appearance" : "DJ Set"}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
              <div className="flex flex-wrap gap-4 text-white/70 text-sm">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#ed6c2a]" />{event.clubName}, {event.city}</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#ed6c2a]" />{formatDate(event.date)}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#ed6c2a]" />{event.startTime} – {event.endTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto">
          {(["overview", "tickets", ...(event.auctionEnabled ? ["auction"] : [])] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={cn("px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition-all",
                activeTab === tab ? "border-[#ed6c2a] text-[#ed6c2a]" : "border-transparent text-gray-500 hover:text-gray-800"
              )}>
              {tab === "auction" ? (
                <span className="flex items-center gap-2">
                  🔨 Auction Bidding
                  {liveBids.length > event.auctionBids.length && (
                    <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                </span>
              ) : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <>
                <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">About this Event</h2>
                  <p className="text-gray-600 leading-relaxed">{event.description}</p>
                </section>
                <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-2xl font-bold mb-5">What's Included</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {["2-hour exclusive appearance","Photo opportunity with celebrity","Welcome drink on arrival","VIP table access (table bookings)","DJ set after appearance","Exclusive merchandise giveaway"].map(i => (
                      <div key={i} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />{i}
                      </div>
                    ))}
                  </div>
                </section>
                {event.auctionEnabled && (
                  <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                    <div className="flex items-start gap-3 mb-5">
                      <Gavel className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h2 className="text-xl font-bold text-amber-900">Premium Seat Auction — Live & Open</h2>
                        <p className="text-amber-700 text-sm mt-1">
                          {event.auctionSeats} front-row/backstage seats. {emptyAuctionSeats > 0 ? `${emptyAuctionSeats} currently unoccupied at minimum bid.` : "All seats currently have active bids."} Anyone can bid any amount — the top {event.auctionSeats} bidders when the auction closes win their seat.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      {[
                        { label: "Closes in", value: `${auctionCountdown.days}d ${auctionCountdown.hours}h ${auctionCountdown.minutes}m` },
                        { label: "Top bid", value: `₹${topBid.toLocaleString("en-IN")}` },
                        { label: "Total bids", value: liveBids.length },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <p className="text-xs text-amber-600 mb-1">{s.label}</p>
                          <p className="font-bold text-amber-900 text-lg">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setActiveTab("auction")}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                      <Gavel className="w-5 h-5" /> Place Your Bid Now
                    </button>
                  </section>
                )}
              </>
            )}

            {/* ── TICKETS ── */}
            {activeTab === "tickets" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-bold mb-1">Book Standard Tickets</h2>
                  <p className="text-gray-500 text-sm">₹{event.standardTicketPrice.toLocaleString("en-IN")} per person · {remaining} tickets remaining</p>
                </div>
                {ticketBooked ? (
                  <div className="p-10 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Booking Confirmed! 🎉</h3>
                    <p className="text-gray-500">A confirmation has been sent to <strong>{form.email}</strong>.</p>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3 text-sm">
                      {["Select", "Details", "Confirm"].map((s, i) => {
                        const idx = ["select","details","confirm"].indexOf(ticketStep);
                        return (
                          <div key={s} className="flex items-center gap-2">
                            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", i <= idx ? "bg-[#ed6c2a] text-white" : "bg-gray-100 text-gray-400")}>{i+1}</span>
                            <span className={i <= idx ? "text-gray-800 font-semibold" : "text-gray-400"}>{s}</span>
                            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                          </div>
                        );
                      })}
                    </div>
                    {ticketStep === "select" && (
                      <div>
                        <label className="block text-sm font-bold mb-3">Number of Tickets</label>
                        <div className="flex items-center gap-4 mb-6">
                          <button onClick={() => setTicketQty(q => Math.max(1,q-1))} className="w-10 h-10 rounded-full border-2 border-gray-200 text-xl font-bold hover:border-[#ed6c2a] transition-colors">−</button>
                          <span className="text-3xl font-bold w-12 text-center">{ticketQty}</span>
                          <button onClick={() => setTicketQty(q => Math.min(10,q+1))} className="w-10 h-10 rounded-full border-2 border-gray-200 text-xl font-bold hover:border-[#ed6c2a] transition-colors">+</button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">{ticketQty} × ₹{event.standardTicketPrice.toLocaleString("en-IN")}</span><span className="font-bold">₹{(ticketQty*event.standardTicketPrice).toLocaleString("en-IN")}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span>₹{Math.round(ticketQty*event.standardTicketPrice*0.18).toLocaleString("en-IN")}</span></div>
                          <div className="flex justify-between font-bold border-t border-gray-200 pt-2"><span>Total</span><span className="text-[#ed6c2a] text-lg">₹{Math.round(ticketQty*event.standardTicketPrice*1.18).toLocaleString("en-IN")}</span></div>
                        </div>
                      </div>
                    )}
                    {ticketStep === "details" && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[{label:"Full Name",key:"name",type:"text"},{label:"Email",key:"email",type:"email"},{label:"Phone",key:"phone",type:"tel"}].map(f => (
                          <div key={f.key} className={f.key==="name"?"sm:col-span-2":""}>
                            <label className="block text-sm font-bold mb-2">{f.label}</label>
                            <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ed6c2a]" />
                          </div>
                        ))}
                      </div>
                    )}
                    {ticketStep === "confirm" && (
                      <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-sm">
                        {[["Event",event.title],["Date",formatDate(event.date)],["Venue",`${event.clubName}, ${event.city}`],["Tickets",`${ticketQty} × Standard`]].map(([l,v]) => (
                          <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-semibold">{v}</span></div>
                        ))}
                        <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                          <span>Total (incl. GST)</span>
                          <span className="text-[#ed6c2a]">₹{Math.round(ticketQty*event.standardTicketPrice*1.18).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                    {!isAuthenticated && !isLoading ? (
                      <Link href={`/auth/signin?redirect=${encodeURIComponent(`/clubs/events/${event.id}`)}`}
                        className="w-full bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg">
                        Sign in to Book
                      </Link>
                    ) : (
                      <button onClick={handleBookTicket} disabled={isBooking || soldOut}
                        className="w-full bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-lg shadow-lg shadow-[#ed6c2a]/20">
                        <Ticket className="w-5 h-5" />
                        {soldOut ? "Sold Out" : ticketStep==="confirm"
                          ? (isBooking ? "Processing..." : `Pay ₹${Math.round(ticketQty*event.standardTicketPrice*1.18).toLocaleString("en-IN")}`)
                          : ticketStep==="details" ? "Review Order" : "Continue"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── AUCTION ── */}
            {activeTab === "auction" && event.auctionEnabled && (
              <div className="space-y-6">
                {/* Live status banner */}
                {myLastBid !== null && (
                  <div className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border font-bold text-sm",
                    isMyBidWinning
                      ? "bg-green-500/10 border-green-500/30 text-green-700"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-700"
                  )}>
                    {isMyBidWinning ? <Trophy className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                    {isMyBidWinning
                      ? `🏆 Your bid of ₹${myLastBid.toLocaleString("en-IN")} is currently WINNING a seat!`
                      : `Your bid of ₹${myLastBid.toLocaleString("en-IN")} is below the winning threshold (₹${lowestWinningBid.toLocaleString("en-IN")}). Bid higher!`
                    }
                  </div>
                )}

                {/* Auction dashboard */}
                <div className="bg-gradient-to-br from-[#0a0a1a] to-[#1a0a05] text-white rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <Gavel className="w-7 h-7 text-amber-400" />
                    <div>
                      <h2 className="text-xl font-bold">Live Auction — {event.auctionSeats} Premium Seats</h2>
                      <p className="text-gray-400 text-sm">Top {event.auctionSeats} bidders when auction closes win a seat. Bid as many times as you want.</p>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <span className="text-sm text-gray-400 flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400" />Closes in:</span>
                    {[{l:"Days",v:auctionCountdown.days},{l:"Hours",v:auctionCountdown.hours},{l:"Mins",v:auctionCountdown.minutes},{l:"Secs",v:auctionCountdown.seconds}].map(({l,v}) => (
                      <div key={l} className="flex flex-col items-center bg-white/10 border border-white/20 rounded-xl px-4 py-2 min-w-[56px]">
                        <span className="text-xl font-bold tabular-nums">{String(v).padStart(2,"0")}</span>
                        <span className="text-xs text-gray-400">{l}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Top Bid", value: `₹${topBid.toLocaleString("en-IN")}`, color: "text-amber-400" },
                      { label: "Min to Win", value: `₹${lowestWinningBid.toLocaleString("en-IN")}`, color: "text-orange-400" },
                      { label: "Total Bids", value: liveBids.length, color: "text-blue-400" },
                      { label: "Total Pooled", value: `₹${totalBidPool.toLocaleString("en-IN")}`, color: "text-green-400" },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                        <BidFlash>
                          <p className={cn("font-bold text-base", s.color)}>{s.value}</p>
                        </BidFlash>
                      </div>
                    ))}
                  </div>

                  {/* Minimum to win visual */}
                  <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300">
                    <TrendingUp className="w-4 h-4 text-amber-400 inline mr-2" />
                    To guarantee a seat right now, bid at least{" "}
                    <span className="font-bold text-amber-400">₹{(lowestWinningBid + 1).toLocaleString("en-IN")}</span>
                    {" "}to beat the lowest winning bid.
                  </div>

                  {/* Bid input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Your Bid Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                        <input
                          type="number"
                          value={bidAmount}
                          min={event.auctionMinBid}
                          step={500}
                          onChange={e => { setBidAmount(Number(e.target.value)); setBidError(""); }}
                          className="w-full bg-white/5 border border-white/20 rounded-xl pl-8 pr-4 py-3.5 text-white text-xl font-bold outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      {bidError && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />{bidError}
                        </p>
                      )}
                    </div>

                    {/* Quick bid increments */}
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center mr-1">Quick add:</span>
                      {[500, 1000, 2000, 5000, 10000].map(inc => (
                        <button key={inc} onClick={() => setBidAmount(b => b + inc)}
                          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-amber-500/20 hover:border-amber-500/30 hover:text-amber-300 transition-all">
                          +₹{inc.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>

                    {!isAuthenticated && !isLoading ? (
                      <Link href={`/auth/signin?redirect=${encodeURIComponent(`/clubs/events/${event.id}`)}`}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg">
                        Sign in to Bid
                      </Link>
                    ) : (
                      <button
                        onClick={handlePlaceBid}
                        disabled={isPlacingBid || bidAmount < event.auctionMinBid}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg"
                      >
                        <Gavel className="w-5 h-5" />
                        {isPlacingBid ? "Placing Bid..." : `Place Bid — ₹${bidAmount.toLocaleString("en-IN")}`}
                      </button>
                    )}

                    {myLastBid !== null && (
                      <p className="text-center text-gray-400 text-xs">
                        <Plus className="w-3 h-3 inline" /> You can bid again to increase your standing
                      </p>
                    )}
                  </div>
                </div>

                {/* Live bid history */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Live Bid Leaderboard</h3>
                    <span className="text-xs text-gray-400">{liveBids.length} bids total</span>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                    {sortedBids.map((bid, idx) => {
                      const isWinning = idx < event.auctionSeats;
                      const isYours = bid.id.startsWith("b-live-") && bid.bidderName.includes("You");
                      return (
                        <div key={bid.id} className={cn("flex items-center justify-between px-5 py-4 transition-colors", isYours && "bg-amber-50")}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                              idx === 0 ? "bg-amber-100 text-amber-700" : isWinning ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}>
                              {idx === 0 ? <Trophy className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div>
                              <p className={cn("font-semibold text-sm", isYours ? "text-amber-700" : "text-gray-800")}>
                                {bid.bidderName} {isYours && <span className="text-xs text-amber-500">(you)</span>}
                              </p>
                              <p className="text-xs text-gray-400">{new Date(bid.placedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("font-bold text-lg", idx === 0 ? "text-amber-600" : isWinning ? "text-green-600" : "text-gray-500")}>
                              ₹{bid.amount.toLocaleString("en-IN")}
                            </p>
                            {isWinning
                              ? <p className={cn("text-xs font-bold", idx === 0 ? "text-amber-500" : "text-green-500")}>
                                  {idx === 0 ? "🥇 Leading" : "✓ Winning"}
                                </p>
                              : <p className="text-xs text-red-400">Not winning</p>
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
                    Top {event.auctionSeats} bidders win a premium seat · Results finalise at auction close
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-28">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => setActiveTab("tickets")}
                  className="w-full bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Ticket className="w-5 h-5" /> Book — ₹{event.standardTicketPrice.toLocaleString("en-IN")}
                </button>
                {event.auctionEnabled && (
                  <button onClick={() => setActiveTab("auction")}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Gavel className="w-5 h-5" /> Bid — Top Bid ₹{topBid.toLocaleString("en-IN")}
                  </button>
                )}
              </div>
              <div className="mt-6 space-y-3 text-sm">
                {[["Venue",event.clubName],["City",event.city],["Date",new Date(event.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})],["Time",`${event.startTime}–${event.endTime}`]].map(([l,v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tickets Left</span>
                  <span className={cn("font-bold", remaining < 30 ? "text-red-500" : "text-green-600")}>{remaining}</span>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>{soldPct}% sold</span><span>{remaining} left</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", soldPct>80?"bg-red-500":soldPct>50?"bg-amber-500":"bg-green-500")} style={{width:`${soldPct}%`}} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-4 mb-3">
                <img src={event.celebrityImage} alt={event.celebrity} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-gray-900">{event.celebrity}</p>
                  <p className="text-xs text-gray-500 capitalize">{event.type.replace("_"," ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500 mb-2">
                {[...Array(5)].map((_,i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                <span className="text-xs text-gray-500 ml-1">Top Demand</span>
              </div>
              <p className="text-sm text-gray-600">Appearing at {event.clubName}, {event.city} for 2 exclusive hours.</p>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
