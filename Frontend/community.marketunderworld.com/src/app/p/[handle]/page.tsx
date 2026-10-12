import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BadgeCheck, MapPin, CalendarDays, ExternalLink } from "lucide-react"
import { socialLabel, SOCIALS } from "@/lib/social"
import Link from "next/link"

import { getPerson, personTitle } from "@/lib/people"
import { SITE_URL } from "@/lib/cms"

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const handle = (await params).handle
  const p = await getPerson(handle)
  if (!p) return { title: "Profile not found", robots: { index: false, follow: false } }
  const title = personTitle(p)
  const description = (p.headline || p.knownFor || p.bio || `${p.name} on Hell Road.`).slice(0, 160)
  const url = `${SITE_URL}/p/${p.handle}`
  return {
    title, description, alternates: { canonical: `/p/${p.handle}` },
    // The member's own choice: their page is listed unless they turned that off.
    robots: p.searchIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description, type: "profile", url, ...(p.photoPath ? { images: [`https://api.baalvion.com/api/v1/community${p.photoPath}`] } : {}) },
  }
}

export default async function PublicProfile({ params }: { params: Promise<{ handle: string }> }) {
  const p = await getPerson((await params).handle)
  if (!p) notFound()
  const ld = {
    "@context": "https://schema.org", "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person", name: p.name, url: `${SITE_URL}/p/${p.handle}`,
      ...(p.headline ? { description: p.headline } : {}), ...(p.photoPath ? { image: `https://api.baalvion.com/api/v1/community${p.photoPath}` } : {}),
      ...(p.isFounder ? { jobTitle: p.role || "Founder", ...(p.company ? { worksFor: { "@type": "Organization", name: p.company } } : {}) } : {}),
      ...(p.city ? { homeLocation: { "@type": "Place", name: p.city } } : {}),
      ...(Object.values(p.links).length ? { sameAs: Object.values(p.links) } : {}),
    },
  }
  const links = SOCIALS.map((s) => [s.key, p.links[s.key]] as const).filter(([, u]) => u)
  const photo = p.photoPath ? `/api/community-proxy${p.photoPath}` : null
  return (
    <div className="min-h-screen bg-[#050508] text-white pt-24 pb-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="max-w-2xl mx-auto px-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt={p.name} className="w-full max-h-[480px] object-cover" /> : <div className="h-40 bg-gradient-to-br from-red-950 to-black" />}
          <div className="p-6 sm:p-8 space-y-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 flex-wrap">{p.name}{p.verified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 rounded-full px-2.5 py-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>}</h1>
              {p.isFounder && (p.role || p.company) && <p className="text-pink-300 mt-1">{[p.role || "Founder", p.company].filter(Boolean).join(" at ")}</p>}
              {p.headline && <p className="text-gray-300 mt-1">{p.headline}</p>}
              <p className="text-sm text-gray-500 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {p.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{p.city}</span>}
                <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />On Hell Road since {new Date(p.since).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
              </p>
            </div>
            {links.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-2">Find me</h2>
                <ul className="flex flex-wrap gap-2">
                  {links.map(([k, u]) => <li key={k}><a href={u} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-white/15 hover:border-red-500/60 text-sm">{socialLabel(k)} <ExternalLink className="w-3.5 h-3.5 text-gray-500" /></a></li>)}
                </ul>
              </div>
            )}
            {p.knownFor && <div><h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-2">Known for</h2><p className="text-gray-200 whitespace-pre-line">{p.knownFor}</p></div>}
            {p.bio && <div><h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-2">About</h2><p className="text-gray-300 whitespace-pre-line">{p.bio}</p></div>}
          </div>
        </div>
        <p className="text-sm text-center mt-6"><Link href="/founders" className="underline text-gray-300">Founders</Link> · <Link href="/people" className="underline text-gray-300">All people</Link></p>
        <p className="text-xs text-gray-600 text-center mt-4">Links open the member&apos;s own accounts on other sites. Hell Road does not control them.</p>
      </div>
    </div>
  )
}
