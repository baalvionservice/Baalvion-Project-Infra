import Link from "next/link"
import { MapPin } from "lucide-react"
import type { Club } from "@/data/clubs-data"
import { typeWord, slugOf } from "@/lib/clubs-seo"

// A plain, fast list of venues for the directory pages: name, kind, area and the facts we really have.
export function VenueList({ clubs, showCity = false }: { clubs: Club[]; showCity?: boolean }) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {clubs.map((c) => (
        <li key={c.id}>
          <Link href={`/clubs/venue/${c.id}`} className="block bg-white border border-gray-200 hover:border-black p-4 h-full">
            <div className="font-bold text-gray-900">{c.name}</div>
            <div className="text-xs text-gray-500 mt-1 capitalize">{typeWord(c)}{c.suburb ? ` · ${c.suburb}` : ""}{showCity ? ` · ${c.city}` : ""}</div>
            {c.address && <div className="text-sm text-gray-600 mt-2 flex gap-1.5"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />{c.address}</div>}
            {c.openingHours && <div className="text-xs text-gray-500 mt-1">Hours: {c.openingHours}</div>}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export const areaHref = (city: string, area: string) => `/clubs/city/${slugOf(city)}/${slugOf(area)}`
