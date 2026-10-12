import Link from "next/link"
import { MapPin } from "lucide-react"
import { listPeople } from "@/lib/people"

const PER = 48

// A plain list of public pages, in the HTML, with page links so every person can be found and crawled.
export async function PeopleDirectory({ founders, base, page, city, q }: { founders: boolean; base: string; page: number; city?: string; q?: string }) {
  const { items, total } = await listPeople({ founders, city, q, limit: PER, offset: (page - 1) * PER })
  const pages = Math.max(1, Math.ceil(total / PER))
  const href = (n: number) => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), ...(city ? { city } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`.replace(/\?$/, "")
  return (
    <div>
      <form action={base} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input name="q" defaultValue={q} placeholder="Search by name, company or role" aria-label="Search" className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-base" />
        <input name="city" defaultValue={city} placeholder="City" aria-label="City" className="sm:w-48 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-base" />
        <button className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-700 font-semibold">Search</button>
      </form>
      <p className="text-sm text-gray-500 mb-4">{total} {total === 1 ? "person" : "people"}</p>
      {items.length === 0 ? <p className="text-gray-400 py-12 text-center">{total === 0 && !q && !city ? "No public pages yet. Members switch theirs on from their dashboard." : "No one matches that search."}</p> : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <li key={p.handle}>
              <Link href={`/p/${p.handle}`} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-red-500/50 p-4">
                {p.photoPath ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/community-proxy${p.photoPath}`} alt={p.name} loading="lazy" className="w-16 h-16 rounded-xl object-cover shrink-0" /> : <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-2xl font-bold text-gray-600 shrink-0">{p.name.slice(0, 1)}</div>}
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-sm text-pink-300 truncate">{p.isFounder ? [p.role || "Founder", p.company].filter(Boolean).join(" at ") : p.headline}</div>
                  {p.city && <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{p.city}</div>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          {page > 1 && <Link rel="prev" href={href(page - 1)} className="px-4 py-2 rounded-lg border border-white/15">Previous</Link>}
          <span className="px-3 text-gray-500">Page {page} of {pages}</span>
          {page < pages && <Link rel="next" href={href(page + 1)} className="px-4 py-2 rounded-lg border border-white/15">Next</Link>}
        </nav>
      )}
    </div>
  )
}
