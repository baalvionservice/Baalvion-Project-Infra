"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import {
  Ticket, Star, Trophy, Users, CheckCircle, Clock,
  ArrowRight, ShieldCheck, AlertCircle, Lock, XCircle, CreditCard
} from "lucide-react";
import { ClubPhoto } from "@/components/clubs/club-photo";
import { useAuth } from "@/context/auth-context";
import { kyc, type KycCase } from "@/lib/api/kyc";
import { admin } from "@/lib/api/nightlife";
import { cn } from "@/lib/utils";

// ─── Mock dynamic draw data (replace with API call) ──────────────────────────
const CURRENT_DRAW = {
  id: "draw-2026-10",
  month: "October",
  year: 2026,
  entryFee: 6,
  maxWinners: 1000,
  totalParticipants: 847,
  closingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59),
  featuredVenues: [
    {
      id: "club-1", name: "Kitty Su", location: "Mumbai, Maharashtra",
      image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop",
      tickets: 334,
    },
    {
      id: "club-2", name: "Privee", location: "Delhi",
      image: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&auto=format&fit=crop",
      tickets: 333,
    },
    {
      id: "club-3", name: "Prism Club & Kitchen", location: "Gurgaon, Delhi NCR",
      image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&auto=format&fit=crop",
      tickets: 333,
    },
  ],
};

const LAST_MONTH_WINNERS = Array.from({ length: 1000 }, (_, i) => ({
  id: `w-${i}`,
  displayName: `Winner #${i + 1}`,
  club: CURRENT_DRAW.featuredVenues[i % 3].name,
}));

// ─── Countdown ───────────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
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
  }, [target]);
  return t;
}

// ─── KYC Gate ────────────────────────────────────────────────────────────────
function KycGate({ kycCase }: { kycCase: KycCase | null }) {
  if (kycCase?.status === "approved") return null;

  return (
    <div className="rounded-2xl border p-6 space-y-4 mb-2
      bg-amber-500/5 border-amber-500/20">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-7 h-7 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-300 text-base mb-1">KYC Verification Required</h3>
          <p className="text-amber-200/70 text-sm leading-relaxed">
            To participate in the lottery and pay your $6 entry fee, you must first complete
            identity verification (KYC). This is a one-time process — once approved, you can
            participate in all future monthly draws.
          </p>
        </div>
      </div>

      {!kycCase && (
        <Link
          href="/kyc?next=/clubs/lottery"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-full text-sm transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          Start KYC Verification
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {kycCase?.status === "submitted" && (
        <div className="flex items-center gap-2 text-amber-300 text-sm">
          <Clock className="w-4 h-4" />
          Your documents are under review. You can participate once approved.
        </div>
      )}

      {kycCase?.status === "rejected" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <XCircle className="w-4 h-4" />
            Your KYC was rejected: {kycCase.rejectionReason ?? "Please re-submit."}
          </div>
          <Link
            href="/kyc?next=/clubs/lottery"
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all"
          >
            Re-submit KYC
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function LotteryClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [kycCase, setKycCase] = useState<KycCase | null | undefined>(undefined);
  const [kycLoading, setKycLoading] = useState(true);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [participants, setParticipants] = useState(CURRENT_DRAW.totalParticipants);
  const [winnersPage, setWinnersPage] = useState(1);
  const WINNERS_PER_PAGE = 50;

  const countdown = useCountdown(CURRENT_DRAW.closingDate);

  const isKycApproved = kycCase?.status === "approved";
  const canParticipate = isAuthenticated && isKycApproved;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setKycLoading(false); return; }
    kyc.mine()
      .then(setKycCase)
      .catch(() => setKycCase(null))
      .finally(() => setKycLoading(false));
  }, [authLoading, isAuthenticated]);

  const handleParticipate = async () => {
    if (!isAuthenticated) { router.push("/auth/signin?next=/clubs/lottery"); return; }
    if (!canParticipate) return;
    setIsProcessing(true);
    setEntryError("");
    try {
      await admin.enterLottery({
        drawId: CURRENT_DRAW.id,
        entryFee: CURRENT_DRAW.entryFee,
      });
      setHasParticipated(true);
      setParticipants(p => p + 1);
    } catch (err: any) {
      // If the backend returns a payment-required status, show payment pending UI
      if (err?.status === 402 || err?.code === "PAYMENT_REQUIRED") {
        setHasParticipated(true); // Show the "entry recorded, pay to confirm" state
      } else {
        setEntryError(err?.message || "Could not enter lottery. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const paginatedWinners = LAST_MONTH_WINNERS.slice(
    (winnersPage - 1) * WINNERS_PER_PAGE,
    winnersPage * WINNERS_PER_PAGE
  );
  const totalPages = Math.ceil(LAST_MONTH_WINNERS.length / WINNERS_PER_PAGE);

  const breadcrumbItems = [
    { label: "Clubs", href: "/clubs" },
    { label: "Monthly Lottery" },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />

      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* ── Hero ──────────────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-[#0a0a1a] to-[#1a0a0a] text-white p-8 md:p-14 rounded-2xl shadow-2xl mb-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ed6c2a]/15 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-800/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ed6c2a] bg-[#ed6c2a]/10 border border-[#ed6c2a]/30 px-3 py-1.5 rounded-full mb-5">
              <Ticket className="w-3.5 h-3.5" />
              {CURRENT_DRAW.month} {CURRENT_DRAW.year} Draw — Live Now
            </span>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Win a Free VIP Ticket<br />to Exclusive Clubs
            </h1>

            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Every month, <strong className="text-white">{CURRENT_DRAW.maxWinners.toLocaleString()} lucky participants</strong> win
              a free VIP ticket to one of our featured clubs. Enter now for just{" "}
              <span className="text-green-400 font-bold">${CURRENT_DRAW.entryFee}</span>.
            </p>

            {/* Participant count */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
              <Users className="w-4 h-4" />
              <span>
                <strong className="text-white">{participants.toLocaleString()}</strong> people have entered this month
              </span>
            </div>

            {/* KYC Gate (shown when not approved) */}
            {!authLoading && !kycLoading && !hasParticipated && (
              <div className="mb-6">
                {!isAuthenticated ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <Lock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-300 font-semibold mb-1">Sign in to participate</p>
                      <p className="text-xs text-gray-500">You must be logged in with a verified identity (KYC) to enter.</p>
                    </div>
                  </div>
                ) : (
                  <KycGate kycCase={kycCase ?? null} />
                )}
              </div>
            )}

            {/* CTA Button */}
            {!hasParticipated ? (
              <>
                <button
                  onClick={handleParticipate}
                  disabled={isProcessing || (isAuthenticated && !canParticipate)}
                  className={cn(
                    "group inline-flex items-center gap-3 font-bold px-8 py-4 rounded-full text-lg transition-all shadow-lg",
                    canParticipate || !isAuthenticated
                      ? "bg-[#ed6c2a] hover:bg-[#d85e21] text-white shadow-[#ed6c2a]/30 disabled:opacity-70"
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isProcessing ? "Processing..." : (
                    <>
                      {!isAuthenticated ? "Sign In & Participate" : `Participate for $${CURRENT_DRAW.entryFee}`}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                {entryError && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {entryError}
                  </div>
                )}
              </>
            ) : (
              <div className="inline-flex items-start gap-4 bg-green-500/10 border border-green-500/30 text-green-400 p-5 rounded-2xl max-w-lg">
                <CheckCircle className="w-7 h-7 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-base mb-1">Entry recorded! 🎉</p>
                  <p className="text-sm text-green-400/80">
                    Your spot is reserved for the {CURRENT_DRAW.month} draw. If payment is required, an admin will contact you via your registered email to confirm the $6 entry fee.
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-green-500/70">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payment confirmation sent to your registered email.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="relative z-10 mt-10 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-gray-400 font-semibold">
              <Clock className="w-4 h-4 text-[#ed6c2a]" />
              Draw closes in:
            </span>
            {[
              { label: "Days", value: countdown.days },
              { label: "Hours", value: countdown.hours },
              { label: "Mins", value: countdown.minutes },
              { label: "Secs", value: countdown.seconds },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-2 min-w-[58px]">
                <span className="text-2xl font-bold tabular-nums">{String(value).padStart(2, "0")}</span>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">

            {/* Featured Clubs */}
            <section>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Star className="w-6 h-6 text-[#ed6c2a]" />
                This Month's Featured Venues
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Winners can redeem their ticket at any of these {CURRENT_DRAW.featuredVenues.length} venues.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {CURRENT_DRAW.featuredVenues.map(club => (
                  <div key={club.id} className="group">
                    <div className="relative h-52 rounded-xl overflow-hidden shadow-md mb-3">
                      <ClubPhoto
                        src={club.image}
                        name={club.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-lg leading-tight">{club.name}</h3>
                        <p className="text-white/70 text-sm">{club.location}</p>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {club.tickets} tickets
                      </div>
                      <div className="absolute top-3 left-3 bg-[#ed6c2a] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        Featured
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Last Month's Winners Table */}
            <section>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-[#ed6c2a]" />
                Last Month's Winners
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                All 1,000 winners from September 2026 — publicly listed for full transparency.
              </p>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold">#</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold">Winner</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold">Venue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedWinners.map((w, idx) => (
                        <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-2.5 text-gray-400 text-xs">
                            {(winnersPage - 1) * WINNERS_PER_PAGE + idx + 1}
                          </td>
                          <td className="px-5 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ed6c2a] to-[#ff9b6a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {String.fromCharCode(65 + (idx % 26))}
                              </span>
                              <span className="font-medium text-gray-800">{w.displayName}</span>
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-gray-500 text-xs">{w.club}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Page {winnersPage} of {totalPages} · 1,000 total winners</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWinnersPage(p => Math.max(1, p - 1))}
                      disabled={winnersPage === 1}
                      className="px-4 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-[#ed6c2a] hover:text-[#ed6c2a] transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setWinnersPage(p => Math.min(totalPages, p + 1))}
                      disabled={winnersPage === totalPages}
                      className="px-4 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-[#ed6c2a] hover:text-[#ed6c2a] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* KYC status box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Your Status</h3>
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Lock className="w-4 h-4" />
                    Not signed in
                  </div>
                  <Link href="/auth/signin?next=/clubs/lottery" className="block text-center bg-[#ed6c2a] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#d85e21] transition-colors">
                    Sign In
                  </Link>
                </div>
              ) : kycLoading ? (
                <p className="text-gray-400 text-sm animate-pulse">Checking KYC status...</p>
              ) : (
                <div className="space-y-3">
                  <div className={cn(
                    "flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg",
                    isKycApproved ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {isKycApproved
                      ? <><CheckCircle className="w-4 h-4" /> KYC Verified</>
                      : <><AlertCircle className="w-4 h-4" /> {kycCase ? `KYC ${kycCase.status}` : "KYC not started"}</>
                    }
                  </div>
                  {!isKycApproved && (
                    <Link href="/kyc?next=/clubs/lottery" className="block text-center bg-amber-500 text-black font-bold py-2.5 rounded-xl text-sm hover:bg-amber-400 transition-colors">
                      Complete KYC
                    </Link>
                  )}
                  {hasParticipated && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                      <Ticket className="w-4 h-4" />
                      Entry confirmed for {CURRENT_DRAW.month}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold mb-5">How it works</h3>
              <ol className="space-y-5 relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100" />
                {[
                  { step: 1, title: "Complete KYC", desc: "Verify your identity once. Required for all participants." },
                  { step: 2, title: "Pay $6 to enter", desc: "One entry per person per draw month." },
                  { step: 3, title: "Wait for the draw", desc: `${CURRENT_DRAW.maxWinners.toLocaleString()} winners are randomly selected at month end.` },
                  { step: 4, title: "Winners listed publicly", desc: "All winners are listed transparently on this page." },
                  { step: 5, title: "Claim your ticket", desc: "Winners get an email with instructions to redeem at the venue." },
                ].map(({ step, title, desc }) => (
                  <li key={step} className="pl-8 relative">
                    <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-[#ed6c2a] text-white flex items-center justify-center font-bold text-xs z-10">
                      {step}
                    </span>
                    <strong className="block text-gray-800 text-sm mb-0.5">{title}</strong>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] text-white p-6 rounded-2xl border border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">{CURRENT_DRAW.month} {CURRENT_DRAW.year}</h3>
              <div className="space-y-4">
                {[
                  { label: "Participants", value: participants.toLocaleString() },
                  { label: "Max Winners", value: CURRENT_DRAW.maxWinners.toLocaleString(), color: "text-[#ed6c2a]" },
                  { label: "Entry Fee", value: `$${CURRENT_DRAW.entryFee}`, color: "text-green-400" },
                  { label: "Featured Venues", value: CURRENT_DRAW.featuredVenues.length.toString() },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span className={cn("font-bold text-lg", color ?? "text-white")}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/clubs" className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-gray-700 hover:border-[#ed6c2a] hover:text-[#ed6c2a] font-bold py-3 rounded-xl transition-all text-sm">
              ← Back to All Clubs
            </Link>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
