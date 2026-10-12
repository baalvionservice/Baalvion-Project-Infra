"use client"

import { useEffect, useState } from "react"
import { COUNTRIES, PLACES, OTHER_CITY, formatPlace, parsePlace, type Place } from "@/lib/locations"

const sel = "h-10 px-3 rounded-lg bg-black border border-white/10 text-sm text-white w-full disabled:opacity-50"

// Country, then state or emirate, then city. Reports one "City, State, Country" line (or "" until it is complete).
export function PlacePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [p, setP] = useState<Place>({ country: "", state: "", city: "" })
  const [other, setOther] = useState("")

  useEffect(() => {
    const pp = parsePlace(value)
    if (pp.country && pp.state && pp.city && !PLACES[pp.country][pp.state].includes(pp.city)) { setOther(pp.city); pp.city = OTHER_CITY }
    setP(pp)
  }, [value === "" ? "" : "set"]) // eslint-disable-line react-hooks/exhaustive-deps

  const push = (next: Place, o = other) => {
    setP(next)
    const city = next.city === OTHER_CITY ? o.trim() : next.city
    onChange(next.country && next.state && city ? formatPlace({ ...next, city }) : "")
  }

  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <select aria-label="Country" className={sel} value={p.country} onChange={(e) => push({ country: e.target.value as Place["country"], state: "", city: "" })}>
        <option value="">Country</option>
        {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>
      <select aria-label="State or emirate" className={sel} value={p.state} disabled={!p.country} onChange={(e) => push({ ...p, state: e.target.value, city: "" })}>
        <option value="">{COUNTRIES.find((c) => c.name === p.country)?.stateLabel ?? "State"}</option>
        {p.country && Object.keys(PLACES[p.country]).map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select aria-label="City" className={sel} value={p.city} disabled={!p.state} onChange={(e) => push({ ...p, city: e.target.value })}>
        <option value="">City or area</option>
        {p.country && p.state && [...PLACES[p.country][p.state], OTHER_CITY].map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      {p.city === OTHER_CITY && <input className={`${sel} sm:col-span-3`} value={other} maxLength={50} placeholder="Type your city" onChange={(e) => { setOther(e.target.value); push(p, e.target.value) }} />}
    </div>
  )
}
