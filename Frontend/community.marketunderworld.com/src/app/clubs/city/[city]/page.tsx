import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { areaHref } from "@/components/clubs/venue-list"
import { CityBrowser } from "@/components/clubs/city-browser"
import { getClubs } from "@/lib/api/nightlife"
import { SITE, breadcrumbJsonLd, groupByCity, itemListJsonLd } from "@/lib/clubs-seo"

async function load(slug: string) {
  return groupByCity(await getClubs()).find((g) => g.slug === slug) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params
  const g = await load(city)
  if (!g) return { title: "Not found" }
  const title = `Pubs, Bars and Nightclubs in ${g.name} (${g.clubs.length} venues)`
  const description = `${g.clubs.length} pubs, bars and nightclubs in ${g.name}, ${g.state}, across ${g.areas.length} areas. Filter by area and type, see addresses and opening hours, and request the guest list or a VIP table.`
  return { title, description, alternates: { canonical: `/clubs/city/${g.slug}` }, openGraph: { title, description, type: "website", url: `${SITE}/clubs/city/${g.slug}` } }
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  const g = await load(city)
  if (!g) notFound()
  const jsonLd = [
    itemListJsonLd(`Pubs, bars and nightclubs in ${g.name}`, g.clubs),
    breadcrumbJsonLd([{ name: "Clubs", path: "/clubs" }, { name: g.name, path: `/clubs/city/${g.slug}` }]),
  ]
  const withHours = g.clubs.filter((c) => c.openingHours).length
  const popular = g.areas.filter((a) => a.clubs.length >= 3).slice(0, 8)
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#1a1a1a]">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-28 pb-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, { label: g.name }]} />

        <header className="mt-8 mb-10 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">Pubs, bars and nightclubs in {g.name}</h1>
          <p className="text-gray-600 mt-4 text-lg leading-relaxed">{g.clubs.length} venues across {g.areas.length} areas of {g.name}, {g.state}. Filter by area and type, open a venue for its address and hours, and ask for the guest list or a VIP table.</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div><dt className="text-gray-500">Venues</dt><dd className="text-2xl font-bold">{g.clubs.length}</dd></div>
            <div><dt className="text-gray-500">Areas</dt><dd className="text-2xl font-bold">{g.areas.length}</dd></div>
            <div><dt className="text-gray-500">With opening hours</dt><dd className="text-2xl font-bold">{withHours}</dd></div>
          </dl>
          {popular.length > 0 && (
            <nav aria-label={`Popular areas in ${g.name}`} className="mt-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Popular areas</p>
              <ul className="flex flex-wrap gap-2">
                {popular.map((a) => (
                  <li key={a.slug}><Link href={areaHref(g.name, a.name)} className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-black rounded-full px-4 py-2 text-sm font-semibold">{a.name}<span className="text-gray-400 font-normal">{a.clubs.length}</span></Link></li>
                ))}
              </ul>
            </nav>
          )}
        </header>

        <CityBrowser clubs={g.clubs} city={g.name} />

        {/* Every area page is linked here for visitors and search engines */}
        <section className="mt-16 pt-10 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-4">All areas in {g.name}</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            {g.areas.map((a) => (
              <li key={a.slug}><Link href={areaHref(g.name, a.name)} className="text-gray-700 hover:text-black hover:underline underline-offset-2">{a.name} <span className="text-gray-400">({a.clubs.length})</span></Link></li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-gray-400 mt-10">Venue locations, addresses and opening hours come from OpenStreetMap contributors (ODbL) and Hell Road&apos;s own listings.</p>
      </main>
      <Footer />
    </div>
  )
}
