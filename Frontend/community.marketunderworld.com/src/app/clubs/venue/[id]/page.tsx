import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, Navigation, Phone, Globe, Music, Ticket, ShieldCheck } from "lucide-react";
import { getClub, getClubs } from "@/lib/api/nightlife";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ClubPhoto } from "@/components/clubs/club-photo";
import { ShareButton } from "@/components/clubs/share-button";
import { SITE, faqJsonLd, slugOf, typeWord, venueJsonLd } from "@/lib/clubs-seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) return { title: "Venue not found" };
  const where = [club.suburb, club.city].filter(Boolean).join(", ");
  const title = club.seoTitle || `${club.name}, ${where}: ${typeWord(club)} address, hours and guest list`;
  const description = club.seoDescription || club.description || `${club.name} is a ${typeWord(club)} in ${where}, ${club.state}.${club.address ? ` Address: ${club.address}.` : ""} Request the guest list or a VIP table.`;
  return { title, description, alternates: { canonical: `/clubs/venue/${club.id}` }, openGraph: { title, description, type: "website", url: `${SITE}/clubs/venue/${club.id}`, ...(club.image || club.gallery?.length ? { images: [club.image, ...(club.gallery ?? []).map((g) => g.url)].filter(Boolean) as string[] } : {}) } };
}

// Only facts we hold are shown. A row with no value is left out, not filled with a guess.
function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 text-gray-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <div className="text-sm text-gray-600 mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await getClub(id);
  if (!club) notFound();

  const where = [club.suburb, club.city].filter(Boolean).join(", ");
  const stateSlug = slugOf(club.state);
  const mapsHref = club.latitude != null && club.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([club.name, club.address, club.city].filter(Boolean).join(", "))}`;
  const site = club.website && /^https?:\/\//i.test(club.website) ? club.website : club.website ? `https://${club.website}` : null;

  const all = await getClubs();
  const nearby = all.filter((c) => c.id !== club.id && c.city === club.city && (club.suburb ? c.suburb === club.suburb : true)).slice(0, 6);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(venueJsonLd(club)) }} />
      {faqJsonLd(club) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(club)) }} />}

      <div className="flex-grow pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <nav className="flex flex-wrap text-sm text-gray-500 font-medium mb-8 gap-y-1">
            <Link href="/" className="hover:text-[#ed6c2a]">Home</Link><span className="mx-2">/</span>
            <Link href={`/clubs/city/${slugOf(club.city)}`} className="hover:text-[#ed6c2a]">{club.city}</Link>
            {club.suburb && (<><span className="mx-2">/</span><Link href={`/clubs/city/${slugOf(club.city)}/${slugOf(club.suburb)}`} className="hover:text-[#ed6c2a]">{club.suburb}</Link></>)}
            <span className="mx-2">/</span><span className="text-gray-900">{club.name}</span>
          </nav>

          {club.image ? (
            <ClubPhoto src={club.image} name={club.name} className="w-full h-[280px] md:h-[380px] rounded-2xl object-cover mb-10" />
          ) : null}

          <header className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#ed6c2a] capitalize">{typeWord(club)}{club.suburb ? ` in ${club.suburb}` : ""}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mt-2 leading-tight">{club.name}</h1>
            <p className="text-gray-600 mt-3 flex items-start gap-2 text-lg"><MapPin className="w-5 h-5 text-gray-400 mt-1 shrink-0" /> {club.address || `${where}, ${club.state}`}</p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition">
                <Navigation className="w-4 h-4 text-[#ed6c2a]" /> Directions
              </a>
              <ShareButton title={club.name} path={`/clubs/venue/${club.id}`} />
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-5">About this place</h2>
                {club.about ? (
                  <div className="space-y-5 text-gray-700 leading-8 text-lg">
                    {club.about.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                ) : (
                <p className="text-gray-700 leading-8 text-lg">
                  {club.description || `${club.name} is a ${typeWord(club)} in ${where}, ${club.state}.${club.address ? ` You can find it at ${club.address}.` : ""}${club.openingHours ? ` Opening hours: ${club.openingHours}.` : ""}`}
                </p>
                )}
                {(club.musicType.length > 0 || club.vibe) && (
                  <p className="mt-5 flex items-center gap-2 text-gray-700"><Music className="w-4 h-4 text-gray-400" /> {[club.vibe, club.musicType.join(", ")].filter(Boolean).join(" · ")}</p>
                )}
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Details</h2>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">
                  <Fact icon={<MapPin className="w-5 h-5" />} label="Address">{club.address || `${where}, ${club.state}`}</Fact>
                  {club.openingHours && <Fact icon={<Clock className="w-5 h-5" />} label="Opening hours">{club.openingHours}</Fact>}
                  {club.daysOpen && <Fact icon={<Clock className="w-5 h-5" />} label="Open on">{club.daysOpen}</Fact>}
                  {club.coverCharge && <Fact icon={<Ticket className="w-5 h-5" />} label="Entry">{club.coverCharge}</Fact>}
                  {club.priceRange && <Fact icon={<Ticket className="w-5 h-5" />} label="Price range">{club.priceRange}</Fact>}
                  {club.phone && <Fact icon={<Phone className="w-5 h-5" />} label="Phone"><a className="underline" href={`tel:${club.phone.replace(/[^+\d]/g, "")}`}>{club.phone}</a></Fact>}
                  {site && <Fact icon={<Globe className="w-5 h-5" />} label="Website"><a className="underline" href={site} target="_blank" rel="noopener noreferrer nofollow">{site.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></Fact>}
                </div>
                <p className="text-xs text-gray-400 mt-3">Location details come from OpenStreetMap contributors (ODbL) and Hell Road&apos;s own listings. If something is wrong, tell us on the contact page.</p>
              </section>

              {club.gallery && club.gallery.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {club.gallery.map((g, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={g.url} alt={g.alt || `${club.name}, ${where}`} loading="lazy" className="w-full h-44 object-cover rounded-xl" />
                    ))}
                  </div>
                </section>
              )}

              {club.faqs && club.faqs.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">Questions about {club.name}</h2>
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl">
                    {club.faqs.map((f, i) => (
                      <details key={i} className="group p-5">
                        <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between gap-4">{f.q}<span className="text-gray-400 group-open:rotate-45 transition-transform">+</span></summary>
                        <p className="mt-3 text-gray-600 leading-7">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {club.requiredRoles && club.requiredRoles.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-5"><ShieldCheck className="w-6 h-6 text-indigo-600" /><h2 className="text-2xl font-bold text-gray-900">Roles this venue hires for</h2></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {club.requiredRoles.map((role) => (
                      <div key={role} className="flex items-center gap-3 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl"><span className="w-2 h-2 bg-indigo-500 rounded-full" /><span className="font-semibold text-indigo-900">{role}</span></div>
                    ))}
                  </div>
                  <Link href="/nightlife/candidate" className="inline-block mt-5 text-indigo-600 font-bold hover:underline text-sm">Browse open gigs &rarr;</Link>
                </section>
              )}

              {nearby.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">More in {club.suburb || club.city}</h2>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {nearby.map((c) => (
                      <li key={c.id}><Link href={`/clubs/venue/${c.id}`} className="block border border-gray-200 hover:border-black rounded-xl p-4"><span className="font-semibold text-gray-900">{c.name}</span><span className="block text-xs text-gray-500 mt-1 capitalize">{typeWord(c)}{c.suburb ? ` · ${c.suburb}` : ""}</span></Link></li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-28 border border-gray-200 rounded-2xl shadow-lg shadow-gray-100 p-7 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Plan your night</h2>
                  <p className="text-gray-500 text-sm mt-1">Send a request to the Hell Road team. Entry is at the venue&apos;s discretion.</p>
                </div>
                <Link href={`/clubs/${stateSlug}/${club.id}/guest-list`} className="block text-center w-full bg-[#ed6c2a] hover:bg-[#d55e20] text-white font-bold py-4 rounded-xl transition">Request guest list</Link>
                <Link href={`/clubs/${stateSlug}/${club.id}/vip-tables`} className="block text-center w-full bg-[#222] hover:bg-black text-white font-bold py-4 rounded-xl transition">Book a VIP table</Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
