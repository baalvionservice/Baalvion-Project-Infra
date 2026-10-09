"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getMyBookings, type ClubBooking, type BookingStatus } from "@/lib/api/nightlife";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ticket, GlassWater, Clock, CalendarDays, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, ChevronRight, Users, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending Review", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: "Confirmed ✓",   color: "bg-green-500/15 text-green-400 border-green-500/30",   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  declined:  { label: "Declined",      color: "bg-red-500/15 text-red-400 border-red-500/30",         icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelled",     color: "bg-gray-500/15 text-gray-400 border-gray-500/30",      icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

function BookingCard({ b }: { b: ClubBooking }) {
  const st = STATUS_CONFIG[b.status];
  const isGuestList = b.kind === "guest_list";
  const date = new Date(b.visitDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const created = new Date(b.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cn(
      "bg-white/5 border rounded-2xl p-5 transition-all",
      b.status === "confirmed" ? "border-green-500/30" : b.status === "declined" ? "border-red-500/20" : "border-white/10"
    )}>
      {/* Top row: kind + club + status */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isGuestList ? "bg-[#ed6c2a]/15" : "bg-purple-500/15"
          )}>
            {isGuestList
              ? <Ticket className="w-5 h-5 text-[#ed6c2a]" />
              : <GlassWater className="w-5 h-5 text-purple-400" />}
          </div>
          <div>
            <p className="font-bold text-white">{b.club?.name}</p>
            <p className="text-xs text-gray-400">{b.club?.city} · {isGuestList ? "Guest List" : "VIP Table"}</p>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border", st.color)}>
          {st.icon} {st.label}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Visit Date</p>
          <p className="font-medium text-white flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-[#ed6c2a]" /> {date}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Name</p>
          <p className="font-medium text-white">{b.firstName} {b.lastName}</p>
        </div>
        {isGuestList ? (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Group</p>
            <p className="font-medium text-white flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              {b.males ?? 0}M + {b.females ?? 0}F
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Package</p>
            <p className="font-medium text-white">{b.tablePackage ?? "Standard"}</p>
          </div>
        )}
      </div>

      {/* Notes (if any) */}
      {b.notes && (
        <p className="text-xs text-gray-500 italic mb-3 bg-white/3 border border-white/5 rounded-lg px-3 py-2">
          &ldquo;{b.notes}&rdquo;
        </p>
      )}

      {/* Footer: reference + submitted at */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-white/5">
        <span>Ref: <code className="text-gray-400 font-mono">{b.id.slice(-12)}</code></span>
        <span>Submitted {created}</span>
      </div>

      {/* Confirmed CTA */}
      {b.status === "confirmed" && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Your booking is confirmed! Show this screen at the venue door.
        </div>
      )}
    </div>
  );
}

type Filter = "all" | "pending" | "confirmed" | "declined";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<ClubBooking[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const load = async () => {
    try {
      const res = await getMyBookings();
      setBookings(res.items);
    } catch {
      setBookings([]);
    } finally {
      setMounted(true);
    }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated]);

  const filtered = filter === "all"
    ? bookings
    : bookings.filter(b => b.status === filter);

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    declined:  bookings.filter(b => b.status === "declined").length,
  };

  if (!isLoading && !isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push(`/auth/signin?redirect=${encodeURIComponent('/clubs/my-bookings')}`);
    }
    return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-white"><RefreshCw className="w-6 h-6 animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#ed6c2a]/15 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-[#ed6c2a]" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">My Bookings</h1>
          </div>
          <p className="text-gray-400 ml-[52px]">
            Track all your guest list and VIP table requests in one place.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total", count: counts.all,       color: "text-white" },
            { label: "Pending",   count: counts.pending,   color: "text-yellow-400" },
            { label: "Confirmed", count: counts.confirmed, color: "text-green-400" },
            { label: "Declined",  count: counts.declined,  color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className={cn("text-2xl font-black", s.color)}>{s.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter pills + Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "confirmed", "declined"] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold border capitalize transition-all",
                  filter === f
                    ? "bg-[#ed6c2a] text-white border-[#ed6c2a]"
                    : "border-white/20 text-gray-400 hover:text-white"
                )}
              >
                {f} ({counts[f as keyof typeof counts]})
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Booking list */}
        {!mounted ? (
          <div className="text-center py-20 text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎟️</p>
            <h2 className="text-xl font-bold text-white mb-2">
              {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
            </h2>
            <p className="text-gray-500 mb-8 text-sm max-w-sm mx-auto">
              {filter === "all"
                ? "Request a guest list or book a VIP table at any club to see it here."
                : `You don't have any ${filter} bookings right now.`}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/clubs"
                className="flex items-center gap-2 bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <Ticket className="w-4 h-4" /> Browse Clubs
              </Link>
              <Link
                href="/clubs/lottery"
                className="flex items-center gap-2 border border-white/20 text-white hover:bg-white/5 font-bold px-6 py-3 rounded-xl transition-colors"
              >
                <Crown className="w-4 h-4 text-[#ed6c2a]" /> Try Lottery
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => <BookingCard key={b.id} b={b} />)}
          </div>
        )}

        {/* Bottom quick-links */}
        {bookings.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-xs text-gray-600 mb-4 uppercase tracking-widest font-bold">Quick Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Browse More Clubs", href: "/clubs", icon: <Ticket className="w-4 h-4" /> },
                { label: "Luxury Lottery", href: "/clubs/lottery", icon: <Crown className="w-4 h-4" /> },
                { label: "Request a DJ", href: "/clubs/dj-demand", icon: <GlassWater className="w-4 h-4" /> },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 hover:border-[#ed6c2a]/40 hover:bg-[#ed6c2a]/5 rounded-xl px-4 py-3 transition-all group"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-300 group-hover:text-white">
                    <span className="text-[#ed6c2a]">{l.icon}</span>
                    {l.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#ed6c2a] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
