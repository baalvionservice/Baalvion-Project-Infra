"use client"

import { useMemo, useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { Club } from "@/data/clubs-data"
import { VenueList } from "@/components/clubs/venue-list"

const TYPES: [string, string][] = [["nightclub", "Nightclubs"], ["pub", "Pubs"], ["bar", "Bars"]]
const PAGE = 24
const AREAS_SHOWN = 10

function Facet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="py-5 border-t border-gray-100 first:border-t-0 first:pt-0">
      <legend className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</legend>
      <div className="space-y-1.5">{children}</div>
    </fieldset>
  )
}

function Option({ checked, onChange, label, count, type = "checkbox" }: { checked: boolean; onChange: () => void; label: string; count?: number; type?: "checkbox" | "radio" }) {
  return (
    <label className="flex items-center gap-3 py-1 text-sm text-gray-800 cursor-pointer hover:text-black">
      <input type={type} checked={checked} onChange={onChange} className="w-4 h-4 accent-black" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-gray-400 tabular-nums">{count}</span>}
    </label>
  )
}

// Directory filters: search, kind, area, details we hold, and sort. Everything runs in the browser on the list it is given.
export function CityBrowser({ clubs, city, showAreaFilter = true }: { clubs: Club[]; city: string; showAreaFilter?: boolean }) {
  const [q, setQ] = useState("")
  const [type, setType] = useState("")
  const [areas, setAreas] = useState<string[]>([])
  const [hours, setHours] = useState(false)
  const [website, setWebsite] = useState(false)
  const [photo, setPhoto] = useState(false)
  const [phone, setPhone] = useState(false)
  const [sort, setSort] = useState<"top" | "az">("top")
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState(false)
  const [allAreas, setAllAreas] = useState(false)
  const [areaQ, setAreaQ] = useState("")

  const areaCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of clubs) if (c.suburb) m.set(c.suburb, (m.get(c.suburb) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [clubs])
  const typeCounts = useMemo(() => Object.fromEntries(TYPES.map(([v]) => [v, clubs.filter((c) => c.venueType === v).length])), [clubs])
  const detail = useMemo(() => ({
    hours: clubs.filter((c) => c.openingHours).length, website: clubs.filter((c) => c.website).length,
    photo: clubs.filter((c) => c.image).length, phone: clubs.filter((c) => c.phone).length,
  }), [clubs])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    const out = clubs.filter((c) =>
      (!t || c.name.toLowerCase().includes(t) || (c.address ?? "").toLowerCase().includes(t) || (c.suburb ?? "").toLowerCase().includes(t)) &&
      (!type || c.venueType === type) && (areas.length === 0 || (c.suburb !== undefined && areas.includes(c.suburb))) &&
      (!hours || !!c.openingHours) && (!website || !!c.website) && (!photo || !!c.image) && (!phone || !!c.phone))
    return sort === "az" ? [...out].sort((a, b) => a.name.localeCompare(b.name)) : out
  }, [clubs, q, type, areas, hours, website, photo, phone, sort])

  const visibleAreas = areaCounts.filter(([a]) => !areaQ || a.toLowerCase().includes(areaQ.toLowerCase())).slice(0, allAreas || areaQ ? 200 : AREAS_SHOWN)
  const toggleArea = (a: string) => { setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a])); setShown(PAGE) }
  const active: { label: string; clear: () => void }[] = [
    ...(type ? [{ label: TYPES.find(([v]) => v === type)?.[1] ?? type, clear: () => setType("") }] : []),
    ...areas.map((a) => ({ label: a, clear: () => toggleArea(a) })),
    ...(hours ? [{ label: "Has opening hours", clear: () => setHours(false) }] : []),
    ...(website ? [{ label: "Has a website", clear: () => setWebsite(false) }] : []),
    ...(phone ? [{ label: "Has a phone number", clear: () => setPhone(false) }] : []),
    ...(photo ? [{ label: "Has a photo", clear: () => setPhoto(false) }] : []),
  ]
  const reset = () => { setQ(""); setType(""); setAreas([]); setHours(false); setWebsite(false); setPhoto(false); setPhone(false); setShown(PAGE) }

  const panel = (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <Facet title="Venue type">
        <Option type="radio" checked={type === ""} onChange={() => { setType(""); setShown(PAGE) }} label="All types" count={clubs.length} />
        {TYPES.filter(([v]) => typeCounts[v] > 0).map(([v, l]) => <Option key={v} type="radio" checked={type === v} onChange={() => { setType(v); setShown(PAGE) }} label={l} count={typeCounts[v]} />)}
      </Facet>
      {showAreaFilter && areaCounts.length > 1 && (
        <Facet title="Area">
          {areaCounts.length > AREAS_SHOWN && (
            <input value={areaQ} onChange={(e) => setAreaQ(e.target.value)} placeholder="Find an area" aria-label="Find an area" className="w-full mb-2 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black" />
          )}
          {visibleAreas.map(([a, n]) => <Option key={a} checked={areas.includes(a)} onChange={() => toggleArea(a)} label={a} count={n} />)}
          {visibleAreas.length === 0 && <p className="text-sm text-gray-500">No area matches.</p>}
          {!areaQ && areaCounts.length > AREAS_SHOWN && (
            <button onClick={() => setAllAreas((v) => !v)} className="text-sm font-semibold underline underline-offset-2 mt-1">{allAreas ? "Show fewer" : `Show all ${areaCounts.length} areas`}</button>
          )}
        </Facet>
      )}
      <Facet title="Details we have">
        <Option checked={hours} onChange={() => { setHours(!hours); setShown(PAGE) }} label="Opening hours" count={detail.hours} />
        <Option checked={website} onChange={() => { setWebsite(!website); setShown(PAGE) }} label="Website" count={detail.website} />
        <Option checked={phone} onChange={() => { setPhone(!phone); setShown(PAGE) }} label="Phone number" count={detail.phone} />
        <Option checked={photo} onChange={() => { setPhoto(!photo); setShown(PAGE) }} label="Photo" count={detail.photo} />
      </Facet>
    </div>
  )

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
      {/* Filters: always visible on large screens, behind a button on phones */}
      <aside className="lg:sticky lg:top-28">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-300 rounded-xl px-5 py-3 font-semibold text-sm mb-3">
          <span className="inline-flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters{active.length > 0 ? ` (${active.length})` : ""}</span>
          <span className="text-gray-400">{open ? "Hide" : "Show"}</span>
        </button>
        <div className={`${open ? "block" : "hidden"} lg:block`}>{panel}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE) }} placeholder={`Search ${city} by name, area or address`} aria-label="Search venues" className="w-full bg-white border border-gray-300 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-black" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as "top" | "az")} aria-label="Sort" className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm">
            <option value="top">Most complete first</option>
            <option value="az">Name A to Z</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5 min-h-[2rem]">
          <p className="text-sm text-gray-600 mr-2"><strong className="text-gray-900">{list.length}</strong> venue{list.length === 1 ? "" : "s"}{list.length !== clubs.length ? ` of ${clubs.length}` : ""}</p>
          {active.map((a) => (
            <button key={a.label} onClick={() => { a.clear(); setShown(PAGE) }} className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold rounded-full pl-3 pr-2 py-1.5" aria-label={`Remove filter ${a.label}`}>
              {a.label} <X className="w-3.5 h-3.5" />
            </button>
          ))}
          {(active.length > 0 || q) && <button onClick={reset} className="text-xs font-semibold underline underline-offset-2 text-gray-600">Clear all</button>}
        </div>

        <div className="mt-5">
          {list.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <p className="font-semibold text-gray-900">No venue matches these filters</p>
              <p className="text-sm text-gray-500 mt-1">Try removing a filter or searching a different name.</p>
              <button onClick={reset} className="mt-5 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">Clear all filters</button>
            </div>
          ) : (
            <>
              <VenueList clubs={list.slice(0, shown)} />
              {list.length > shown && (
                <div className="text-center mt-10">
                  <button onClick={() => setShown((n) => n + PAGE)} className="px-8 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold hover:border-black">Show {Math.min(PAGE, list.length - shown)} more</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
