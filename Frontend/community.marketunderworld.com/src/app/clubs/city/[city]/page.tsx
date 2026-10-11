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
  const description = `${g.clubs.length} pubs, bars and nightclubs in ${g.name}, ${g.state}, across ${g.areas.length} areas. Browse by area, see addresses and opening hours, and request the guest list or a VIP table.`
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
  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222]">
      <Navbar />
      <main className="max-w-[1100px] mx-auto px-5 sm:px-6 py-10 mt-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="mb-6"><Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, { label: g.name }]} /></div>
        <h1 className="text-3xl md:text-4xl font-bold">Pubs, bars and nightclubs in {g.name}</h1>
        <p className="text-gray-600 mt-3 max-w-3xl">{g.clubs.length} venues in {g.name}, {g.state}, across {g.areas.length} areas. Pick an area to see its venues, or open a venue to request the guest list or a VIP table. Venues are ranked by how much we can verify about them: photo, address, website and opening hours.</p>

        {g.areas.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3">Areas in {g.name}</h2>
            <ul className="flex flex-wrap gap-2">
              {g.areas.map((a) => (
                <li key={a.slug}><Link href={areaHref(g.name, a.name)} className="inline-block bg-white border border-gray-300 hover:border-black rounded-full px-4 py-1.5 text-sm font-semibold">{a.name} <span className="text-gray-400 font-normal">{a.clubs.length}</span></Link></li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-5">All venues in {g.name}</h2>
          <CityBrowser clubs={g.clubs} city={g.name} />
        </section>

        <p className="text-xs text-gray-400 mt-10">Venue locations, addresses and opening hours come from OpenStreetMap contributors (ODbL) and Hell Road&apos;s own listings.</p>
      </main>
      <Footer />
    </div>
  )
}
