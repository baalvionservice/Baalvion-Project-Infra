"use client";

import { useState, useEffect } from "react";
import {
  Star, Plus, X, Save, MapPin, CalendarDays, Gavel,
  CheckCircle, Clock, TrendingUp, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INDIAN_NIGHTLIFE_STATES } from "@/data/clubs-data";
import { CELEBRITY_EVENTS, type CelebrityEvent } from "@/data/celebrity-events";
import { admin } from "@/lib/api/nightlife";



const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Tab = "events";

export default function AdminCelebrityEventsPage() {
  const [tab] = useState<Tab>("events");
  const [events, setEvents] = useState<CelebrityEvent[]>(CELEBRITY_EVENTS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", celebrity: "", type: "celebrity_appearance" as CelebrityEvent["type"],
    clubName: "", city: "", state: INDIAN_NIGHTLIFE_STATES[0],
    date: "", startTime: "9:00 PM", endTime: "11:00 PM",
    description: "",
    standardTicketPrice: 3000, standardTicketsTotal: 200,
    auctionEnabled: true, auctionSeats: 10, auctionMinBid: 10000,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load real events from API on mount; fall back to static seed on failure
  useEffect(() => {
    admin.events()
      .then(res => {
        if (res.items && res.items.length > 0) {
          // Map ApiEvent → CelebrityEvent shape for rendering
          setEvents(res.items.map(e => ({
            id: e.id,
            type: "celebrity_appearance" as CelebrityEvent["type"],
            title: e.eventName,
            celebrity: e.djName ?? "",
            celebrityImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
            clubId: e.clubId,
            clubName: e.club?.name ?? "",
            city: e.club?.city ?? "",
            state: e.club?.state ?? "",
            date: e.date,
            startTime: "9:00 PM",
            endTime: "11:00 PM",
            description: e.description ?? "",
            coverImage: e.image ?? "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&auto=format&fit=crop",
            standardTicketPrice: 0,
            standardTicketsTotal: 0,
            standardTicketsSold: 0,
            auctionEnabled: false,
            auctionSeats: 0,
            auctionCurrentBid: 0,
            auctionMinBid: 0,
            auctionEndTime: "",
            auctionBids: [],
            status: e.status === "active" ? "upcoming" : "cancelled",
          })));
        }
      })
      .catch(() => { /* keep static seed on error */ })
      .finally(() => setLoading(false));
  }, []);



  const handleSave = async () => {
    setSaving(true);
    try {
      const created = await admin.createEvent({
        eventName: form.title,
        djName: form.celebrity,
        eventDate: form.date,
        description: form.description,
        tag: "BUY TICKETS",
        status: "active",
      });
      // Optimistic local update with returned data
      const newEvent: CelebrityEvent = {
        id: created.id,
        type: form.type,
        title: form.title,
        celebrity: form.celebrity,
        celebrityImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
        clubId: form.clubName,
        clubName: form.clubName,
        city: form.city,
        state: form.state,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        description: form.description,
        coverImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&auto=format&fit=crop",
        standardTicketPrice: form.standardTicketPrice,
        standardTicketsTotal: form.standardTicketsTotal,
        standardTicketsSold: 0,
        auctionEnabled: form.auctionEnabled,
        auctionSeats: form.auctionSeats,
        auctionCurrentBid: form.auctionMinBid,
        auctionMinBid: form.auctionMinBid,
        auctionEndTime: new Date(new Date(form.date).getTime() - 2 * 86400000).toISOString(),
        auctionBids: [],
        status: "upcoming",
      };
      setEvents(prev => [newEvent, ...prev]);
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowForm(false); }, 2000);
    } catch (err: any) {
      alert(err?.message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  const cancelEvent = async (id: string) => {
    try {
      await admin.updateEvent(id, { status: "cancelled" });
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: "cancelled" } : e));
    } catch (err: any) {
      alert(err?.message || "Failed to cancel event");
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Star className="w-8 h-8 text-[#ed6c2a]" />
            Celebrity Events & DJ Demands
          </h1>
          <p className="text-gray-400 mt-1">
            Create celebrity appearances · manage public DJ demands · set auction parameters
          </p>
        </div>
        {tab === "events" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Celebrity Event
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Upcoming Events", value: events.filter(e => e.status === "upcoming").length, color: "text-[#ed6c2a]" },
          { label: "Total Tickets Sold", value: events.reduce((s, e) => s + e.standardTicketsSold, 0).toLocaleString(), color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">{s.label}</p>
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Single tab header for events only */}
      <div className="flex items-center gap-2 border-b border-white/10">
        <div className="px-5 py-3 text-sm font-bold border-b-2 border-[#ed6c2a] text-[#ed6c2a]">
          Celebrity &amp; DJ Events
        </div>
        <a
          href="/admin/clubs/dj-demands"
          className="ml-auto flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Manage DJ Demands →
        </a>
      </div>

      {/* ── EVENTS TAB ─────────────────────────────────────────────────────── */}
      {tab === "events" && (
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-700" />
              Loading events from backend…
            </div>
          )}
          {!loading && events.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🎪</p>
              <p className="text-gray-400 font-medium">No events yet. Create the first celebrity event above.</p>
            </div>
          )}
          {events.map(event => (
            <div key={event.id} className={cn(
              "bg-white/5 border rounded-2xl p-5 transition-all",
              event.status === "cancelled" ? "border-white/5 opacity-50" : "border-white/10 hover:border-white/20"
            )}>
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <img src={event.coverImage} alt={event.title} className="w-full md:w-36 h-24 object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">{event.title}</h3>
                      <div className="flex flex-wrap gap-3 text-gray-400 text-sm">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#ed6c2a]" />{event.clubName}, {event.city}, {event.state}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-[#ed6c2a]" />{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#ed6c2a]" />{event.startTime} – {event.endTime}</span>
                      </div>
                    </div>
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", {
                      "bg-green-500/20 text-green-400": event.status === "upcoming",
                      "bg-blue-500/20 text-blue-400": event.status === "live",
                      "bg-gray-500/20 text-gray-400": event.status === "completed" || event.status === "cancelled",
                    })}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Ticket Price</p>
                      <p className="font-bold text-sm">₹{event.standardTicketPrice.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Tickets Sold</p>
                      <p className="font-bold text-sm text-green-400">{event.standardTicketsSold}/{event.standardTicketsTotal}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="font-bold text-sm text-green-400">₹{(event.standardTicketsSold * event.standardTicketPrice).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Auction Top Bid</p>
                      <p className="font-bold text-sm text-amber-400">
                        {event.auctionEnabled ? `₹${event.auctionCurrentBid.toLocaleString("en-IN")}` : "—"}
                      </p>
                    </div>
                  </div>

                  {event.status === "upcoming" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelEvent(event.id)}
                        className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel Event
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DEMANDS TAB ─────────────────────────────────────────────────────── */}
      {tab === "demands" && (
        <div className="space-y-4">
          {/* Source badge + filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(["all", "open", "confirmed"] as const).map(f => (
                <button key={f} onClick={() => setDemandFilter(f)}
                  className={cn("px-4 py-1.5 rounded-full text-xs font-bold border capitalize transition-all",
                    demandFilter === f ? "bg-purple-600 text-white border-purple-600" : "border-white/20 text-gray-400 hover:text-white"
                  )}>
                  {f === "all" ? `All (${demands.length})` : `${f} (${demands.filter(d => d.status === f).length})`}
                </button>
              ))}
            </div>
            {newDemandsCount > 0 && (
              <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full">
                📥 {newDemandsCount} new submission{newDemandsCount > 1 ? "s" : ""} from public DJ Demand page
              </span>
            )}
          </div>

          {filteredDemands.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">🎵</p>
              <p className="font-medium">No {demandFilter === "all" ? "" : demandFilter} demands yet.</p>
              <p className="text-sm mt-1">Public submissions from the DJ Demand page will appear here.</p>
            </div>
          )}

          {filteredDemands.map(demand => {
            const pct = Math.min(100, Math.round((demand.totalBidAmount / demand.targetAmount) * 100));
            const isNew = demand.id.startsWith("dmd-new-");
            return (
              <div key={demand.id} className={cn(
                "bg-white/5 border rounded-2xl p-5",
                isNew ? "border-purple-500/40" : "border-white/10"
              )}>
                {isNew && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full mb-3">
                    📥 New Public Submission
                  </span>
                )}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={demand.djImage} alt={demand.djName} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-white">{demand.djName} <span className="text-xs text-gray-500">· {demand.genre}</span></h3>
                        <p className="text-gray-400 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#ed6c2a]" />{demand.clubName}, {demand.city}, {demand.state}</p>
                      </div>
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full",
                        demand.status === "confirmed" ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"
                      )}>
                        {demand.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                      <div><p className="text-xs text-gray-500">Pledged</p><p className="font-bold">₹{demand.totalBidAmount.toLocaleString("en-IN")}</p></div>
                      <div><p className="text-xs text-gray-500">Target</p><p className="font-bold">₹{demand.targetAmount.toLocaleString("en-IN")}</p></div>
                      <div><p className="text-xs text-gray-500">Supporters</p><p className="font-bold flex items-center gap-1"><Users className="w-3.5 h-3.5" />{demand.requestedBy.toLocaleString()}</p></div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="text-purple-400 font-bold">{pct}% funded</span>
                        <span>₹{(demand.targetAmount - demand.totalBidAmount).toLocaleString("en-IN")} remaining</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", demand.status === "confirmed" ? "bg-green-500" : "bg-purple-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {demand.status === "open" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => confirmDemand(demand.id)}
                          className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl hover:bg-green-500/20 transition-all font-bold"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirm & Book Event
                        </button>
                        <button
                          onClick={() => rejectDemand(demand.id)}
                          className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-all"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                    {demand.status === "confirmed" && (
                      <p className="text-green-400 text-sm font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Event confirmed — create a celebrity event for this
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Event Modal ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0d0d1a]">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-[#ed6c2a]" /> New Celebrity Event
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Type */}
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Event Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(["celebrity_appearance", "dj_set", "live_concert"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn("px-4 py-2 rounded-xl text-sm font-bold border capitalize transition-all",
                        form.type === t ? "bg-[#ed6c2a] border-[#ed6c2a] text-white" : "bg-white/5 border-white/10 text-gray-400"
                      )}
                    >
                      {t.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Event Title *", key: "title", placeholder: "e.g. An Evening with Imran Hashmi" },
                  { label: "Celebrity / Artist Name *", key: "celebrity", placeholder: "e.g. Imran Hashmi" },
                  { label: "Club / Venue Name *", key: "clubName", placeholder: "e.g. Kitty Su" },
                  { label: "City *", key: "city", placeholder: "e.g. Mumbai" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">{f.label}</label>
                    <input
                      value={(form as any)[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a]"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">State</label>
                  <select
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a]"
                  >
                    {INDIAN_NIGHTLIFE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Event Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Start Time</label>
                  <input
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    placeholder="9:00 PM"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">End Time</label>
                  <input
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    placeholder="11:00 PM"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Ticket Price (₹)</label>
                  <input
                    type="number"
                    value={form.standardTicketPrice}
                    onChange={e => setForm({ ...form, standardTicketPrice: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Total Tickets</label>
                  <input
                    type="number"
                    value={form.standardTicketsTotal}
                    onChange={e => setForm({ ...form, standardTicketsTotal: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#ed6c2a] resize-none"
                />
              </div>

              {/* Auction toggle */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Gavel className="w-4 h-4" /> Enable Auction for Premium Seats
                  </label>
                  <button
                    onClick={() => setForm({ ...form, auctionEnabled: !form.auctionEnabled })}
                    className={cn("w-12 h-6 rounded-full transition-all border",
                      form.auctionEnabled ? "bg-amber-500 border-amber-500" : "bg-white/10 border-white/20"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded-full bg-white transition-all mx-0.5", form.auctionEnabled ? "ml-6" : "")} />
                  </button>
                </div>
                {form.auctionEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Auction Seats</label>
                      <input type="number" value={form.auctionSeats} onChange={e => setForm({ ...form, auctionSeats: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-amber-400" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Minimum Bid (₹)</label>
                      <input type="number" value={form.auctionMinBid} onChange={e => setForm({ ...form, auctionMinBid: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-amber-400" />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.celebrity || !form.clubName || !form.city || !form.date}
                className="w-full bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? "Creating..." : saved ? "✓ Created!" : <><Save className="w-5 h-5" />Create Event</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
