"use client"

import { useState } from "react";
import { submitVipTable } from "@/lib/api/nightlife";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Check, Phone } from "lucide-react";
import { Club } from "@/data/clubs-data";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { ClubPhoto } from "@/components/clubs/club-photo";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

export function VipTablesClient({ club, state }: { club: Club; state: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const packages = club.vipPackages ?? [];
  const [selectedPackage, setSelectedPackage] = useState(packages.find((p) => p.popular)?.name ?? packages[0]?.name ?? "");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateAttending: "",
    groupSize: "4",
    specialRequests: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const tomorrow = getTomorrow();

  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useState(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  });

  const sendConfirmationEmail = async (ref: string) => {
    try {
      await fetch("/api/send-booking-confirmation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "vip_table",
          clubName: club.name,
          clubCity: club.city,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          visitDate: formData.dateAttending,
          groupSize: Number(formData.groupSize),
          tablePackage: selectedPackage || undefined,
          notes: formData.specialRequests || undefined,
          bookingRef: ref,
        }),
      });
    } catch { /* email is best-effort — never block the flow */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ── Date validation: must be at least tomorrow ──────────────────────────
    if (!formData.dateAttending) {
      setError("Please select a visit date.");
      return;
    }
    const chosen = new Date(formData.dateAttending);
    const todayEnd = new Date();
    todayEnd.setHours(0, 0, 0, 0);
    if (chosen <= todayEnd) {
      setError("Visit date must be tomorrow or later. Same-day VIP requests are not accepted.");
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    setSubmitting(true);
    try {
      // Try real API first; fall back to local store
      const booking = await submitVipTable(club.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        visitDate: formData.dateAttending,
        groupSize: Number(formData.groupSize),
        tablePackage: selectedPackage || undefined,
        notes: formData.specialRequests || undefined,
      });
      setBookingRef(booking.id);
      await sendConfirmationEmail(booking.id);
      setSubmitted(true);
    } catch (error: any) {
      setError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: "Clubs", href: "/clubs" },
    { label: state, href: `/clubs/${state}` },
    { label: `${club.name} VIP Tables` }
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />

      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">

        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Main Column ── */}
          <div className="flex-1 space-y-8">

            {/* Hero Banner */}
            <div className="relative h-72 overflow-hidden">
              <ClubPhoto src={club.image} name={club.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-end p-8">
                <span className="text-xs font-bold uppercase tracking-widest text-[#ed6c2a] mb-2">VIP Table Reservations</span>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                  {club.name}<br />Bottle Service
                </h1>
                <p className="text-gray-300 mt-2 text-sm">{club.city} · {club.daysOpen}</p>
              </div>
            </div>

            {/* Intro */}
            <div className="bg-white p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold mb-4 text-[#111]">
                {club.name} Table Reservations & Bottle Service
              </h2>
              <p className="text-[#555] leading-relaxed mb-4">
                Request a VIP table at {club.name} in {club.city}. Submitting the form sends your request to the venue; it does not reserve or guarantee a table.
              </p>
              <p className="text-[#555] leading-relaxed">
                Minimums and inclusions vary by date and section, and the venue confirms availability and pricing with you directly.
              </p>
            </div>

            {/* Package Cards: shown only when the venue has published packages */}
            {packages.length > 0 && (
            <div className="bg-white p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-6 text-[#111] uppercase tracking-wider border-b border-gray-100 pb-4">
                Choose Your Package
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <button
                    key={pkg.name}
                    onClick={() => setSelectedPackage(pkg.name)}
                    className={`text-left p-5 border-2 transition-all rounded-sm relative ${
                      selectedPackage === pkg.name
                        ? "border-[#ed6c2a] bg-orange-50"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ed6c2a] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                        Most Popular
                      </span>
                    )}
                    <div className="text-lg font-bold text-[#111] mb-1">{pkg.name}</div>
                    <div className="text-2xl font-black text-[#ed6c2a] mb-3">{pkg.minimumSpend}</div>
                    {pkg.location && <div className="text-xs text-gray-500 mb-1">{pkg.location}</div>}
                    {pkg.capacity && <div className="text-xs text-gray-500 mb-1">{pkg.capacity}</div>}
                    {pkg.bottles && <div className="text-xs font-semibold text-[#333] mb-3">{pkg.bottles}</div>}
                    <ul className="space-y-1">
                      {pkg.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-2 text-xs text-gray-600">
                          <Check className="w-3 h-3 text-[#ed6c2a] flex-shrink-0" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Reservation Form */}
            <div className="bg-[#1a1a1a] p-8 shadow-sm" id="table-form">
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                RESERVE YOUR TABLE
              </h2>
              <p className="text-gray-400 text-sm text-center mb-8">
                Complete the form below and the venue will get back to you to confirm.
              </p>

              {submitted ? (
              <div className="bg-green-900/30 border border-green-500/40 text-green-300 p-6 text-center rounded-xl">
                  <Check className="w-10 h-10 mx-auto mb-3 text-green-400" />
                  <h3 className="text-xl font-bold mb-2 text-white">Reservation Request Received! 🎉</h3>
                  <p className="text-sm mb-3">Your VIP table request for <strong className="text-white">{club.name}</strong> has been submitted. The venue will contact you to confirm availability and pricing; nothing is charged at this stage.</p>
                  {bookingRef && (
                    <p className="text-xs bg-green-900/40 border border-green-700/40 px-3 py-2 rounded-lg font-mono text-green-300 mb-4">
                      Booking Ref: <strong>{bookingRef}</strong>
                    </p>
                  )}
                  <Link
                    href="/clubs/my-bookings"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm mt-1"
                  >
                    📋 View My Bookings
                  </Link>
                </div>
              ) : !isAuthenticated && !isLoading ? (
                <div className="bg-[#2a2a2a] p-8 text-center rounded-xl space-y-6">
                  <h3 className="text-2xl font-bold text-white">
                    SIGN IN TO RESERVE
                  </h3>
                  <p className="text-gray-400">You must be logged into your account to request VIP table service for {club.name}.</p>
                  <div className="pt-4">
                    <Link href={`/auth/signin?redirect=${encodeURIComponent(`/clubs/${state}/${club.id}/vip-tables`)}`} className="inline-flex items-center gap-2 bg-[#ed6c2a] hover:bg-[#d55b1f] text-white font-bold px-8 py-3 rounded-xl transition-colors">
                      Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selected Package Display */}
                  {selectedPackage && (
                    <div className="bg-[#2a2a2a] border border-[#ed6c2a]/30 p-4 mb-6">
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Selected Package</p>
                      <p className="text-white font-bold">{selectedPackage} — {packages.find(p => p.name === selectedPackage)?.minimumSpend} minimum</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">First Name *</label>
                      <input
                        type="text" required
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-[#303030] text-[#bfbfbf] border-0 p-3 text-sm outline-none focus:ring-1 focus:ring-[#ed6c2a] placeholder:text-[#666]"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Last Name *</label>
                      <input
                        type="text" required
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-[#303030] text-[#bfbfbf] border-0 p-3 text-sm outline-none focus:ring-1 focus:ring-[#ed6c2a] placeholder:text-[#666]"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Email Address *</label>
                      <input
                        type="email" required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#303030] text-[#bfbfbf] border-0 p-3 text-sm outline-none focus:ring-1 focus:ring-[#ed6c2a] placeholder:text-[#666]"
                        placeholder="you@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Mobile Phone *</label>
                      <input
                        type="tel" required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#303030] text-[#bfbfbf] border-0 p-3 text-sm outline-none focus:ring-1 focus:ring-[#ed6c2a] placeholder:text-[#666]"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Event Date *</label>
                      <input
                        type="date" required
                        min={tomorrow}
                        value={formData.dateAttending}
                        onChange={e => setFormData({ ...formData, dateAttending: e.target.value })}
                        className="w-full bg-[#303030] text-[#bfbfbf] border-0 p-3 text-sm outline-none focus:ring-1 focus:ring-[#ed6c2a]"
                      />
                      <p className="text-xs text-gray-500 mt-1">Future dates only. Same-day VIP not accepted.</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Group Size *</label>
                      <select
                        required
                        value={formData.groupSize}
                        onChange={e => setFormData({ ...formData, groupSize: e.target.value })}
                        className="w-full bg-[#303030] text-[#bfbfbf] border-0 p-3 text-sm outline-none focus:ring-1 focus:ring-[#ed6c2a] cursor-pointer"
                      >
                        {[2,3,4,5,6,7,8,10,12,15,20,25,30].map(n => (
                          <option key={n} value={n}>{n === 30 ? "25+" : n} people</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Special Requests / Occasion</label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
                      rows={3}
                      className="w-full bg-[#303030] text-[#bfbfbf] border-0 p-3 text-sm outline-none focus:ring-1 focus:ring-[#ed6c2a] resize-none placeholder:text-[#666]"
                      placeholder="Birthday, anniversary, bachelorette party, etc..."
                    />
                  </div>

                  {error && <p role="alert" className="text-sm text-red-400 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#f96a30] hover:bg-[#e05520] disabled:opacity-60 text-black font-bold text-base py-4 transition-colors uppercase tracking-widest mt-2"
                  >
                    {submitting ? "Submitting..." : "Request VIP Table"}
                  </button>

                  <p className="text-center text-xs text-gray-500 mt-2">
                    By submitting this form, you agree to our terms. A VIP host will contact you to confirm your reservation.
                  </p>
                </form>
              )}
            </div>

            {/* Info Section */}
            <div className="bg-white p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-[#111]">What To Expect With Bottle Service</h2>
              <ul className="space-y-3">
                {[
                  "Your table will be reserved and held for 30 minutes after the agreed arrival time.",
                  "A minimum spend applies per table, not per person. This goes toward alcohol and mixers.",
                  "Dress code is strictly enforced — upscale nightlife attire required.",
                  "All guests must carry valid government-issued photo ID.",
                  "Our VIP host will greet you at the entrance and escort you to your table.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#555] text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#ed6c2a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-[320px] space-y-6">

            {/* Quick Contact */}
            <div className="bg-[#1a1a1a] p-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white border-b border-gray-700 pb-4 mb-4">
                Need Help? Contact Us
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                Speak directly with a VIP host to plan your perfect night out at {club.name}.
              </p>
              <a
                href="tel:+919999999999"
                className="flex items-center justify-center gap-2 w-full bg-[#f96a30] hover:bg-[#e05520] text-black font-bold py-3 transition-colors text-sm uppercase"
              >
                <Phone className="w-4 h-4" /> Call VIP Host
              </a>
            </div>

            {/* Club Info */}
            <div className="bg-white p-6 shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-4 mb-4">
                Club Details
              </h4>
              <ClubPhoto src={club.image} name={club.name} className="w-full h-auto mb-4 object-cover aspect-video" />
              <div className="space-y-2 text-sm text-[#555]">
                <p><strong className="text-[#111]">Venue:</strong> {club.name}</p>
                <p><strong className="text-[#111]">City:</strong> {club.city}</p>
                <p><strong className="text-[#111]">Music:</strong> {club.musicType.join(", ")}</p>
                <p><strong className="text-[#111]">Open:</strong> {club.daysOpen}</p>
                <p><strong className="text-[#111]">Rating:</strong> ★ {club.rating} / 5</p>
              </div>
              <Link
                href={`/clubs/${state}/${club.id}/guest-list`}
                className="block mt-4 w-full bg-[#ed6c2a] hover:bg-[#d85e21] text-white text-center font-bold py-3 text-sm transition-colors uppercase"
              >
                Free Guest List Instead
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="bg-white p-6 shadow-sm border border-gray-200 text-center">
              <h4 className="text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-4 mb-4">
                Why Book With Us?
              </h4>
              {[
                ["★★★★★", "Trusted by 10,000+ guests"],
                ["24h", "Booking confirmation"],
                ["🔒", "Secure, private inquiry"],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 text-left">
                  <span className="text-[#ed6c2a] font-bold text-sm w-16 text-center flex-shrink-0">{icon}</span>
                  <span className="text-xs text-[#555]">{text}</span>
                </div>
              ))}
            </div>

          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
