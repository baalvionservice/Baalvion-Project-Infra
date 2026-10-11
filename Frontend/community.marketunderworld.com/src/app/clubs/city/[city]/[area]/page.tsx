import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { VenueList, areaHref } from "@/components/clubs/venue-list"
import { getClubs } from "@/lib/api/nightlife"
import { SITE, breadcrumbJsonLd, groupByCity, itemListJsonLd } from "@/lib/clubs-seo"

async function load(citySlug: string, areaSlug: string) {
  const g = groupByCity(await getClubs()).find((x) => x.slug === citySlug)
  const a = g?.areas.find((x) => x.slug === areaSlug)
  return g && a ? { g, a } : null
}

export async function generateMetadata({ params }: { params: Promise<{ city: string; area: string }> }): Promise<Metadata> {
  const { city, area } = await params
  const r = await load(city, area)
  if (!r) return { title: "Not found" }
  const title = `Pubs, Bars and Nightclubs in ${r.a.name}, ${r.g.name} (${r.a.clubs.length}) | Hell Road`
  const description = `${r.a.clubs.length} pubs, bars and nightclubs in ${r.a.name}, ${r.g.name}. See addresses and opening hours, and request the guest list or a VIP table.`
  return { title, description, alternates: { canonical: `/clubs/city/${r.g.slug}/${r.a.slug}` }, openGraph: { title, description, type: "website", url: `${SITE}/clubs/city/${r.g.slug}/${r.a.slug}` } }
}

export default async function AreaPage({ params }: { params: Promise<{ city: string; area: string }> }) {
  const { city, area } = await params
  const r = await load(city, area)
  if (!r) notFound()
  const { g, a } = r
  const jsonLd = [
    itemListJsonLd(`Pubs, bars and nightclubs in ${a.name}, ${g.name}`, a.clubs),
    breadcrumbJsonLd([{ name: "Clubs", path: "/clubs" }, { name: g.name, path: `/clubs/city/${g.slug}` }, { name: a.name, path: `/clubs/city/${g.slug}/${a.slug}` }]),
  ]
  const nearby = g.areas.filter((x) => x.slug !== a.slug).slice(0, 12)
  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222]">
      <Navbar />
      <main className="max-w-[1100px] mx-auto px-4 py-8 mt-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="mb-6"><Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, { label: g.name, href: `/clubs/city/${g.slug}` }, { label: a.name }]} /></div>
        <h1 className="text-3xl md:text-4xl font-bold">Pubs, bars and nightclubs in {a.name}, {g.name}</h1>
        <p className="text-gray-600 mt-3 max-w-3xl">{a.clubs.length} venue{a.clubs.length === 1 ? "" : "s"} in {a.name}. Open one to see its address and hours, and to request the guest list or a VIP table.</p>
        <section className="mt-8"><VenueList clubs={a.clubs} /></section>
        {nearby.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold mb-3">Other areas in {g.name}</h2>
            <ul className="flex flex-wrap gap-2">
              {nearby.map((x) => <li key={x.slug}><Link href={areaHref(g.name, x.name)} className="inline-block bg-white border border-gray-300 hover:border-black rounded-full px-4 py-1.5 text-sm font-semibold">{x.name} <span className="text-gray-400 font-normal">{x.clubs.length}</span></Link></li>)}
            </ul>
          </section>
        )}
        <p className="text-xs text-gray-400 mt-10">Venue locations, addresses and opening hours come from OpenStreetMap contributors (ODbL) and Hell Road&apos;s own listings.</p>
      </main>
      <Footer />
    </div>
  )
}
