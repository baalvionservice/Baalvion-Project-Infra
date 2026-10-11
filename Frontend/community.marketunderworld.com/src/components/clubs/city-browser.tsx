"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import type { Club } from "@/data/clubs-data"
import { VenueList } from "@/components/clubs/venue-list"
import { slugOf } from "@/lib/clubs-seo"

const TYPES: [string, string][] = [["", "All"], ["nightclub", "Nightclubs"], ["pub", "Pubs"], ["bar", "Bars"]]
const PAGE = 30

// Filters for a list of venues: name, kind, area, and whether we hold hours, a website or a photo.
export function CityBrowser({ clubs, city, showAreaFilter = true }: { clubs: Club[]; city: string; showAreaFilter?: boolean }) {
  const [q, setQ] = useState("")
  const [type, setType] = useState("")
  const [area, setArea] = useState("")
  const [hours, setHours] = useState(false)
  const [website, setWebsite] = useState(false)
  const [photo, setPhoto] = useState(false)
  const [sort, setSort] = useState<"top" | "az">("top")
  const [shown, setShown] = useState(PAGE)

  const areas = useMemo(() => Array.from(new Set(clubs.map((c) => c.suburb).filter(Boolean) as string[])).sort(), [clubs])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const out = clubs.filter((c) =>
      (!t || c.name.toLowerCase().includes(t) || (c.address ?? "").toLowerCase().includes(t)) &&
      (!type || c.venueType === type) && (!area || c.suburb === area) &&
      (!hours || !!c.openingHours) && (!website || !!c.website) && (!photo || !!c.image))
    return sort === "az" ? [...out].sort((a, b) => a.name.localeCompare(b.name)) : out
  }, [clubs, q, type, area, hours, website, photo, sort])

  const chip = (on: boolean) => `px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${on ? "bg-[#222] text-white border-[#222]" : "bg-white text-gray-700 border-gray-300 hover:border-black"}`
  const reset = () => { setQ(""); setType(""); setArea(""); setHours(false); setWebsite(false); setPhoto(false); setShown(PAGE) }

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder={`Search ${city} by name or address`} aria-label="Search venues" className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-black" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Venue type">
          {TYPES.map(([v, l]) => <button key={l} onClick={() => { setType(v); setShown(PAGE) }} aria-pressed={type === v} className={chip(type === v)}>{l}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          {showAreaFilter && areas.length > 1 && (
            <label className="flex items-center gap-2 text-gray-700">Area
              <select value={area} onChange={(e) => { setArea(e.target.value); setShown(PAGE) }} className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                <option value="">All areas</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={hours} onChange={(e) => setHours(e.target.checked)} /> Has opening hours</label>
          <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={website} onChange={(e) => setWebsite(e.target.checked)} /> Has a website</label>
          <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} /> Has a photo</label>
          <label className="flex items-center gap-2 text-gray-700 sm:ml-auto">Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as "top" | "az")} className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="top">Most complete first</option>
              <option value="az">A to Z</option>
            </select>
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-6 mb-4">{list.length} venue{list.length === 1 ? "" : "s"}{list.length !== clubs.length ? ` of ${clubs.length}` : ""}</p>
      {list.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-600">No venue matches. <button onClick={reset} className="underline">Clear the filters</button></div>
      ) : (
        <>
          <VenueList clubs={list.slice(0, shown)} />
          {list.length > shown && (
            <div className="text-center mt-8">
              <button onClick={() => setShown((n) => n + PAGE)} className="px-8 py-3 border border-gray-300 rounded-xl text-sm font-bold hover:border-black">Show {Math.min(PAGE, list.length - shown)} more</button>
            </div>
          )}
        </>
      )}
      <p className="sr-only"><Link href={`/clubs/city/${slugOf(city)}`}>{city}</Link></p>
    </div>
  )
}
