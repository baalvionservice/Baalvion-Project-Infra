import Link from "next/link"
import { Clock, Globe, MapPin } from "lucide-react"
import type { Club } from "@/data/clubs-data"
import { typeWord, slugOf } from "@/lib/clubs-seo"

const BADGE: Record<string, string> = { nightclub: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", pub: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-sky-50 text-sky-700 border-sky-200" }

// A venue card: what it is, where it is, and the facts we really have.
export function VenueList({ clubs, showCity = false }: { clubs: Club[]; showCity?: boolean }) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clubs.map((c) => (
        <li key={c.id}>
          <Link href={`/clubs/venue/${c.id}`} className="group flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-900 hover:shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-lg text-gray-900 leading-snug group-hover:underline underline-offset-2">{c.name}</h3>
              {c.venueType && <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${BADGE[c.venueType] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>{typeWord(c)}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">{c.suburb ?? ""}{c.suburb && showCity ? ", " : ""}{showCity ? c.city : ""}</p>
            {c.address && <p className="text-sm text-gray-600 mt-3 flex gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" /><span>{c.address}</span></p>}
            {(c.openingHours || c.website) && (
              <div className="mt-auto pt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {c.openingHours && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {c.openingHours}</span>}
                {c.website && <span className="inline-flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</span>}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export const areaHref = (city: string, area: string) => `/clubs/city/${slugOf(city)}/${slugOf(area)}`
