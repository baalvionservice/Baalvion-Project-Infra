import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getClub } from "@/lib/api/nightlife";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ClubPhoto } from "@/components/clubs/club-photo";
import { ClubActionButtons } from "@/components/clubs/club-action-buttons";
import {
  MapPin, Star, Clock, Music,
  CheckCircle2, ShieldCheck, GlassWater, Ticket, ChevronRight
} from "lucide-react";

// ─── SEO helpers ─────────────────────────────────────────────────────────────
const TIER1 = ["Maharashtra", "Delhi (NCT)", "Karnataka", "Goa"];

function stateToCity(state: string, city: string) {
  return city || state.replace(" (NCT)", "").replace(" NCR", "");
}

// ─── generateMetadata — full SEO per venue ───────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; clubId: string }>;
}): Promise<Metadata> {
  const { clubId } = await params;
  const club = await getClub(clubId);
  if (!club) return { title: "Club Not Found" };

  const city = stateToCity(club.state, club.city);
  const title = `${club.name} ${city} | Guest List, VIP Tables & Cover Charge 2026`;
  const description = `Get on the free guest list at ${club.name} in ${club.suburb ? `${club.suburb}, ` : ""}${city}. Book VIP bottle service, check dress code, DJ lineup and cover charge. ${club.description?.slice(0, 100) ?? ""}`;

  return {
    title,
    description,
    keywords: [
      club.name,
      `${club.name} guest list`,
      `${club.name} VIP table`,
      `nightclub ${city}`,
      `${city} clubs`,
      `${club.suburb ?? city} pub`,
      ...club.musicType.map((m) => `${m} club ${city}`),
      `${club.state} nightlife`,
    ],
    openGraph: {
      title,
      description,
      images: club.image ? [{ url: club.image, alt: club.name }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/clubs/${club.state.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${clubId}`,
    },
  };
}

// ─── JSON-LD structured data ─────────────────────────────────────────────────
function ClubJsonLd({ club, clubId, state }: { club: any; clubId: string; state: string }) {
  const city = stateToCity(club.state, club.city);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NightClub",
    name: club.name,
    description: club.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: club.address ?? "",
      addressLocality: city,
      addressRegion: club.state,
      addressCountry: "IN",
    },
    geo: { "@type": "GeoCoordinates" },
    url: `https://community.marketunderworld.com/clubs/${state}/${clubId}`,
    image: club.image || "",
    aggregateRating: club.rating > 0 ? {
      "@type": "AggregateRating",
      ratingValue: club.rating,
      bestRating: 5,
      ratingCount: 120,
    } : undefined,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: club.daysOpen,
      opens: "20:00",
      closes: "01:30",
    },
    priceRange: "₹₹₹",
    servesCuisine: "Cocktails & Bar Food",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "VIP Tables", value: true },
      { "@type": "LocationFeatureSpecification", name: "Dance Floor", value: true },
      { "@type": "LocationFeatureSpecification", name: "Guest List", value: true },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ state: string; clubId: string }>;
}) {
  const { state, clubId } = await params;
  const club = await getClub(clubId);
  if (!club) notFound();

  const city = stateToCity(club.state, club.city);
  const tier = TIER1.includes(club.state) ? "Tier 1" : "Tier 2";
  const toSlug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const breadcrumbs = [
    { label: "Clubs", href: "/clubs" },
    { label: club.state, href: `/clubs/${toSlug(club.state)}` },
    ...(club.suburb ? [{ label: club.suburb }] : []),
    { label: club.name },
  ];

  return (
    <>
      <ClubJsonLd club={club} clubId={clubId} state={state} />
      <div className="min-h-screen bg-[#f3f4f7] font-sans">
        <Navbar />

        <main className="mt-20">
          {/* Hero image */}
          <div className="relative h-[45vh] min-h-[320px] overflow-hidden">
            <ClubPhoto src={club.image} name={club.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Breadcrumb on top of hero */}
            <div className="absolute top-4 left-0 right-0 max-w-[1200px] mx-auto px-4">
              <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-white/60">
                {breadcrumbs.map((b, i) => (
                  <span key={b.label} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3 h-3" />}
                    {b.href ? (
                      <Link href={b.href} className="hover:text-white transition-colors">{b.label}</Link>
                    ) : (
                      <span className="text-white/90 font-medium">{b.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 max-w-[1200px] mx-auto px-4 pb-8">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      tier === "Tier 1" ? "bg-orange-500/90 text-white" : "bg-blue-500/90 text-white"
                    }`}>{tier}</span>
                    {club.vibe && (
                      <span className="text-xs text-white/70 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">{club.vibe}</span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight">{club.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#ed6c2a]" />
                      {club.suburb ? `${club.suburb}, ` : ""}{city}, {club.state}
                    </span>
                    {club.daysOpen && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#ed6c2a]" />{club.daysOpen}
                      </span>
                    )}
                    {club.rating > 0 && (
                      <span className="flex items-center gap-1 bg-green-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-white" />{club.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA action bar */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-[1200px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/clubs/${state}/${clubId}/guest-list`}
                  className="flex items-center gap-2 bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm shadow-md shadow-[#ed6c2a]/25"
                >
                  📋 Join Guest List — Free Entry
                </Link>
                <Link
                  href={`/clubs/${state}/${clubId}/vip-tables`}
                  className="flex items-center gap-2 bg-[#111] hover:bg-black text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
                >
                  🥂 Book VIP Table
                </Link>
              </div>
              <ClubActionButtons
                clubName={club.name}
                address={club.address}
                city={city}
                state={club.state}
              />
            </div>
          </div>

          {/* Body */}
          <div className="max-w-[1200px] mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Left / Main ── */}
              <div className="lg:col-span-2 space-y-6">

                {/* About */}
                <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About {club.name}</h2>
                  <p className="text-gray-600 leading-relaxed text-base">{club.description}</p>

                  {/* Music tags */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {club.musicType.map(m => (
                      <span key={m} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                        <Music className="w-3.5 h-3.5" />{m}
                      </span>
                    ))}
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">{club.coverCharge}</span>
                  </div>
                </section>

                {/* Venue highlights */}
                <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-5">Venue Highlights</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Full Bar & Premium Spirits",
                      "Live DJ Performances",
                      "VIP Bottle Service",
                      "Dance Floor",
                      "Valet Parking",
                      "Smoking Zone",
                      "Dress Code Enforced",
                      "Photo Opportunities",
                      "Celebrity Appearances",
                    ].map(h => (
                      <div key={h} className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />{h}
                      </div>
                    ))}
                  </div>
                </section>

                {/* What people love */}
                <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">What People Love Here</h2>
                  <div className="flex flex-wrap gap-2">
                    {["Premium DJ Nights", "Exclusive Guest Lists", "VIP Bottle Service", "Celebrity Spotting", "Late Night Sets", "Elite Crowd"].map(tag => (
                      <span key={tag} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">{tag}</span>
                    ))}
                  </div>
                </section>

                {/* VIP packages */}
                {club.vipPackages && club.vipPackages.length > 0 && (
                  <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-5">VIP Table Packages</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {club.vipPackages.map(pkg => (
                        <div key={pkg.name} className={`p-5 rounded-2xl border ${pkg.popular ? "border-[#ed6c2a] bg-orange-50" : "border-gray-200 bg-gray-50"}`}>
                          {pkg.popular && (
                            <span className="text-xs font-bold text-[#ed6c2a] uppercase tracking-wider mb-2 block">⭐ Most Popular</span>
                          )}
                          <h3 className="font-bold text-gray-900 text-lg mb-1">{pkg.name}</h3>
                          <p className="text-[#ed6c2a] font-bold text-xl mb-3">{pkg.minimumSpend}</p>
                          <ul className="space-y-1.5">
                            {pkg.perks.map(p => (
                              <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />{p}
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={`/clubs/${state}/${clubId}/vip-tables`}
                            className="mt-4 block text-center bg-[#222] hover:bg-black text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                          >
                            Book This Package
                          </Link>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Roles / Hiring */}
                {club.requiredRoles && club.requiredRoles.length > 0 && (
                  <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-xl font-bold text-gray-900">Industry & Hiring</h2>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">This venue actively recruits nightlife professionals:</p>
                    <div className="flex flex-wrap gap-2">
                      {club.requiredRoles.map(role => (
                        <span key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{role}
                        </span>
                      ))}
                    </div>
                    <Link href="/nightlife/candidate" className="mt-4 inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm hover:underline">
                      Browse open gigs <ChevronRight className="w-4 h-4" />
                    </Link>
                  </section>
                )}

                {/* SEO text block */}
                <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    {club.name} — {city} Nightlife Guide 2026
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {club.name} is one of {city}'s premier nightlife destinations{club.suburb ? ` in ${club.suburb}` : ""}. Known for its{" "}
                    {club.vibe?.toLowerCase() ?? "vibrant atmosphere"}, the venue attracts an elite crowd looking for
                    premium DJ nights, exclusive VIP bottle service, and unforgettable nightlife experiences.
                    {club.daysOpen ? ` Open ${club.daysOpen}.` : ""} Cover charge: {club.coverCharge}.
                    Sign up for the free guest list to get priority entry, or book a VIP table for the full bottle-service experience.
                    {club.address ? ` Located at ${club.address}.` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      `${club.name} guest list`,
                      `${club.name} VIP table`,
                      `${city} nightclub`,
                      `${club.suburb ?? city} pub`,
                      `best clubs ${city} 2026`,
                    ].map(kw => (
                      <span key={kw} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{kw}</span>
                    ))}
                  </div>
                </section>
              </div>

              {/* ── Right Sidebar ── */}
              <aside className="space-y-5">

                {/* Sticky booking widget */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-md sticky top-28 overflow-hidden">
                  <div className="p-6">
                    <h3 className="font-black text-xl text-gray-900 mb-1">Plan Your Night</h3>
                    <p className="text-gray-400 text-xs mb-5">at {club.name}</p>

                    {/* Info */}
                    <div className="space-y-3.5 mb-6 text-sm">
                      {[
                        { icon: Clock, label: "Opens", value: club.daysOpen ? `${club.daysOpen} from 8 PM` : "Check venue" },
                        { icon: MapPin, label: "Address", value: club.address || `${club.suburb ?? city}, ${club.state}` },
                        { icon: GlassWater, label: "Cover Charge", value: club.coverCharge || "Check with venue" },
                        { icon: Star, label: "Rating", value: club.rating > 0 ? `${club.rating}/5` : "Top Rated" },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex gap-3">
                          <Icon className="w-4 h-4 text-[#ed6c2a] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide">{label}</p>
                            <p className="text-gray-600 leading-snug">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5">
                      <Link
                        href={`/clubs/${state}/${clubId}/guest-list`}
                        className="w-full flex items-center justify-center gap-2 bg-[#ed6c2a] hover:bg-[#d85e21] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-[#ed6c2a]/25 text-sm"
                      >
                        📋 Join Guest List — Free
                      </Link>
                      <Link
                        href={`/clubs/${state}/${clubId}/vip-tables`}
                        className="w-full flex items-center justify-center gap-2 bg-[#0f0f0f] hover:bg-black text-white font-black py-4 rounded-xl transition-all text-sm"
                      >
                        🥂 Book VIP Table
                      </Link>
                    </div>
                  </div>

                  {/* Map placeholder */}
                  <div className="h-40 relative overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
                      alt={`Map near ${club.name}`}
                      className="w-full h-full object-cover opacity-50 grayscale"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white px-4 py-2 rounded-full font-bold text-sm text-gray-800 shadow-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#ed6c2a]" /> View on Maps
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lottery CTA */}
                <div className="bg-gradient-to-br from-[#ed6c2a] to-[#ff9b6a] rounded-2xl p-5 text-white shadow-lg">
                  <Ticket className="w-6 h-6 mb-2 opacity-90" />
                  <h3 className="font-bold text-lg mb-1">Monthly Ticket Lottery</h3>
                  <p className="text-white/85 text-sm mb-4">Win free VIP tickets for top venues this month. Just ₹499 to enter.</p>
                  <Link href="/clubs/lottery" className="block text-center bg-white/20 hover:bg-white/30 font-bold py-2.5 rounded-xl transition-colors text-sm">
                    Enter Lottery →
                  </Link>
                </div>
              </aside>

            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
