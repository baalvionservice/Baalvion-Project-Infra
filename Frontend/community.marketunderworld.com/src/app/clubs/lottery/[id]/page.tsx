import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { PageContent } from "@/components/cms/page-content"
import { DrawEnter } from "@/components/clubs/draw-enter"
import { getDraw, priceLabel } from "@/lib/api/draws-server"
import { getPage, SITE_URL } from "@/lib/cms"
import { breadcrumbJsonLd } from "@/lib/clubs-seo"

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" })
const STATUS: Record<string, string> = { open: "Open for entries", closed: "Closed, waiting for the draw", drawn: "Drawn", cancelled: "Cancelled and refunded", draft: "Not open yet" }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const [d, p] = await Promise.all([getDraw(id), getPage(`clubs/lottery/${id}`)])
  if (!d) return { title: "Draw not found", robots: { index: false } }
  const place = d.state ? ` in ${d.state}` : ""
  const title = p?.seoTitle || `${d.title}: club ticket draw${place}`
  const description = p?.seoDescription || `${d.title}. Prize: ${d.prize}. ${priceLabel(d.entryPoints)}, ${d.winnersCount} winner${d.winnersCount === 1 ? "" : "s"}, picked by a recorded random draw. Closes ${when(d.closesAt)}. 18+ only.`
  return { title, description, alternates: { canonical: `/clubs/lottery/${id}` }, robots: p?.noindex ? { index: false } : undefined, openGraph: { title, description, type: "website", url: `${SITE_URL}/clubs/lottery/${id}` } }
}

export default async function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getDraw(id)
  if (!d) notFound()
  const ld = breadcrumbJsonLd([{ name: "Clubs", path: "/clubs" }, { name: "Ticket draw", path: "/clubs/lottery" }, { name: d.title, path: `/clubs/lottery/${id}` }])
  const facts: [string, string][] = [
    ["Entry", priceLabel(d.entryPoints) + (d.entryPoints ? ` (${d.entryPoints.toLocaleString()} points)` : "")],
    ["Winners", String(d.winnersCount)],
    ["Entries so far", `${d.entries} from ${d.members} member${d.members === 1 ? "" : "s"}`],
    ["Max entries each", String(d.maxEntriesPerUser)],
    ["Closes", when(d.closesAt)],
    ["Status", STATUS[d.status] ?? d.status],
  ]
  return (
    <div className="min-h-screen bg-[#f3f4f7] font-sans text-[#222]">
      <Navbar />
      <main className="container max-w-[900px] mx-auto px-4 py-8 mt-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <div className="mb-6"><Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, { label: "Ticket draw", href: "/clubs/lottery" }, { label: d.title }]} /></div>
        <h1 className="text-3xl md:text-4xl font-bold">{d.title}{d.state && <span className="ml-3 text-xs font-bold uppercase align-middle px-2 py-0.5 border border-gray-300">{d.state}</span>}</h1>
        <p className="text-lg text-gray-700 mt-2">Prize: {d.prize}</p>

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white border border-gray-200 p-5">
          {facts.map(([k, v]) => <div key={k}><dt className="text-xs uppercase tracking-widest text-gray-500">{k}</dt><dd className="font-semibold mt-1">{v}</dd></div>)}
        </dl>

        {d.status === "open" && <section className="mt-6 bg-white border border-gray-200 p-6"><h2 className="text-xl font-bold mb-3">Enter this draw</h2><DrawEnter drawId={d.id} maxEntries={d.maxEntriesPerUser} entryPoints={d.entryPoints} /></section>}

        {d.status === "drawn" && (
          <section className="mt-6 bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-bold">Winners</h2>
            <ul className="mt-3 text-sm grid sm:grid-cols-2 gap-x-6 gap-y-1">{d.winners.map((w) => <li key={w.position}>{w.position}. Member #{w.memberNumber ?? "—"} · ticket #{w.ticketNo}</li>)}</ul>
            {d.drawSeed && <p className="mt-4 text-xs text-gray-500 break-all">Draw seed: {d.drawSeed}. Entries are ranked by HMAC-SHA256 of the entry id with this seed; the first {d.winnersCount} distinct members win, so anyone can check the result.</p>}
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">How this draw works</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>You pay for an entry with wallet points (100 points = $1). {priceLabel(d.entryPoints)} for this draw.</li>
            <li>Each entry gets a ticket number. You can hold up to {d.maxEntriesPerUser}.</li>
            <li>When the draw closes, {d.winnersCount} winner{d.winnersCount === 1 ? " is" : "s are"} picked at random. The draw seed is published so the result can be checked.</li>
            <li>Winners are listed here by member number, and the team contacts them to hand over the prize.</li>
            <li>If a draw is cancelled, every entry is refunded to the wallet.</li>
          </ol>
          <p className="text-sm text-gray-500 mt-4">Entry is for adults, 18 and over.</p>
        </section>

        <PageContent slug={`clubs/lottery/${id}`} heading={`About ${d.title}`} />
        <PageContent slug="clubs/lottery" heading="About the ticket draw" />
        <p className="mt-6 text-sm"><Link href="/clubs/lottery" className="underline">See all draws</Link></p>
      </main>
      <Footer />
    </div>
  )
}
