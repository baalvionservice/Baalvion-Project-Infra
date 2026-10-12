"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Crosshair, Globe2, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { INDIAN_NIGHTLIFE_STATES, type Club } from "@/data/clubs-data";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { ClubPhoto } from "@/components/clubs/club-photo";
import { COUNTRY_SHORT, EMIRATES, countryOf, kmBetween, type CountryKey } from "@/lib/club-geo";

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
const TYPES: [string, string][] = [["nightclub", "Nightclubs"], ["pub", "Pubs"], ["bar", "Bars"]];
type Sort = "top" | "az" | "near";
interface Filters { country: "" | CountryKey; state: string; city: string; area: string; type: string; q: string; sort: Sort; contact: boolean }
const EMPTY: Filters = { country: "", state: "", city: "", area: "", type: "", q: "", sort: "top", contact: false };

function counts<T>(rows: T[], key: (r: T) => string | undefined) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r); if (k) m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function Chip({ on, onClick, children, n }: { on: boolean; onClick: () => void; children: React.ReactNode; n?: number }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap", on ? "bg-[#222] text-white border-[#222]" : "bg-white text-gray-700 border-gray-300 hover:border-[#ed6c2a] hover:text-[#ed6c2a]")}>
      {children}{n !== undefined && <span className={cn("ml-1.5 text-xs", on ? "text-gray-300" : "text-gray-400")}>{n}</span>}
    </button>
  );
}

export function ClubsClient({ clubs, preselectedState }: { clubs: Club[]; preselectedState?: string }) {
  const initialState = useMemo(() => {
    if (!preselectedState) return "";
    const all = Array.from(new Set([...clubs.map((c) => c.state), ...INDIAN_NIGHTLIFE_STATES, ...EMIRATES]));
    return all.find((s) => toSlug(s) === preselectedState) || "";
  }, [clubs, preselectedState]);
  const [f, setF] = useState<Filters>({ ...EMPTY, state: initialState, country: initialState ? countryOf(initialState) : "" });
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(24);

  // Share a filtered view by its link, and come back to it.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = (k: string) => p.get(k) || "";
    if (![...p.keys()].length) return;
    setF((cur) => ({ ...cur, country: (g("country") as Filters["country"]) || cur.country, state: g("state") || cur.state, city: g("city"), area: g("area"), type: g("type"), q: g("q"), contact: g("contact") === "1", sort: g("sort") === "az" ? "az" : "top" }));
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (f.country) p.set("country", f.country);
    if (f.state && f.state !== initialState) p.set("state", f.state);
    if (f.city) p.set("city", f.city);
    if (f.area) p.set("area", f.area);
    if (f.type) p.set("type", f.type);
    if (f.q) p.set("q", f.q);
    if (f.contact) p.set("contact", "1");
    if (f.sort === "az") p.set("sort", "az");
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [f, initialState]);

  const set = (patch: Partial<Filters>) => { setF((cur) => ({ ...cur, ...patch })); setVisible(24); };

  // Each filter row counts what is left after the filters above it, so a choice never leads to an empty page.
  const inCountry = clubs.filter((c) => !f.country || countryOf(c.state) === f.country);
  const inState = inCountry.filter((c) => !f.state || c.state === f.state);
  // An emirate or state with a single city goes straight to that city's areas.
  const cities = counts(inState, (c) => c.city);
  const city = f.city || (f.state && cities.length === 1 ? cities[0][0] : "");
  const inCity = inState.filter((c) => !city || c.city === city);
  const inArea = inCity.filter((c) => !f.area || (c.suburb || c.city) === f.area);
  const countryCounts = counts(clubs, (c) => countryOf(c.state));
  const stateCounts = counts(inCountry, (c) => c.state);
  const cityCounts = cities;
  const areaCounts = city ? counts(inCity, (c) => c.suburb) : [];
  const typeCounts = counts(inArea, (c) => c.venueType);

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    let rows = inArea.filter((c) => (!f.type || c.venueType === f.type)
      && (!f.contact || !!(c.website || c.phone || c.openingHours))
      && (!q || [c.name, c.suburb, c.city, c.address].some((x) => (x || "").toLowerCase().includes(q))));
    if (f.sort === "near" && here) {
      const d = (c: Club) => (c.latitude != null && c.longitude != null ? kmBetween(here.lat, here.lon, c.latitude, c.longitude) : 1e9);
      rows = [...rows].sort((a, b) => d(a) - d(b));
    } else if (f.sort === "az") rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [inArea, f, here]);

  const nearMe = () => {
    setGeoError("");
    if (!navigator.geolocation) return setGeoError("Your browser cannot share location.");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setHere({ lat: pos.coords.latitude, lon: pos.coords.longitude }); set({ sort: "near" }); },
      () => setGeoError("Allow location to sort by distance, or pick a city instead."),
      { timeout: 8000 },
    );
  };

  const active = [f.country && COUNTRY_SHORT[f.country], f.state, f.city, f.area, f.type && TYPES.find((t) => t[0] === f.type)?.[1], f.contact && "With contact details", f.q && `"${f.q}"`].filter(Boolean) as string[];
  const place = f.area || f.city || f.state || (f.country ? COUNTRY_SHORT[f.country] : "India and Dubai");
  const dist = (c: Club) => (here && c.latitude != null && c.longitude != null ? kmBetween(here.lat, here.lon, c.latitude, c.longitude) : null);

  const filters = (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Country</p>
        <div className="flex flex-wrap gap-2">
          <Chip on={!f.country} onClick={() => set({ country: "", state: "", city: "", area: "" })} n={clubs.length}>Both</Chip>
          {countryCounts.map(([c, n]) => <Chip key={c} on={f.country === c} onClick={() => set({ country: c as CountryKey, state: "", city: "", area: "" })} n={n}>{COUNTRY_SHORT[c as CountryKey]}</Chip>)}
        </div>
      </div>
      {stateCounts.length > 1 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{f.country === "United Arab Emirates" ? "Emirate" : "State"}</p>
          <div className="flex flex-wrap gap-2">
            <Chip on={!f.state} onClick={() => set({ state: "", city: "", area: "" })}>All</Chip>
            {stateCounts.map(([s, n]) => <Chip key={s} on={f.state === s} onClick={() => set({ state: s, country: countryOf(s), city: "", area: "" })} n={n}>{s}</Chip>)}
          </div>
        </div>
      )}
      {cityCounts.length > 1 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">City</p>
          <div className="flex flex-wrap gap-2">
            <Chip on={!f.city} onClick={() => set({ city: "", area: "" })}>All</Chip>
            {cityCounts.slice(0, 14).map(([c, n]) => <Chip key={c} on={f.city === c} onClick={() => set({ city: c, area: "" })} n={n}>{c}</Chip>)}
          </div>
        </div>
      )}
      {areaCounts.length > 1 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Area in {city}</p>
          <div className="flex flex-wrap gap-2">
            <Chip on={!f.area} onClick={() => set({ area: "" })}>All areas</Chip>
            {areaCounts.slice(0, 20).map(([a, n]) => <Chip key={a} on={f.area === a} onClick={() => set({ area: a })} n={n}>{a}</Chip>)}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Type</p>
        <div className="flex flex-wrap gap-2">
          <Chip on={!f.type} onClick={() => set({ type: "" })}>Any</Chip>
          {TYPES.filter(([k]) => typeCounts.some(([t]) => t === k)).map(([k, l]) => <Chip key={k} on={f.type === k} onClick={() => set({ type: k })} n={typeCounts.find(([t]) => t === k)?.[1]}>{l}</Chip>)}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="accent-[#ed6c2a]" checked={f.contact} onChange={(e) => set({ contact: e.target.checked })} /> Only venues with a website, phone or opening hours</label>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f7] text-[#222] font-sans">
      <Navbar />
      <main className="container max-w-[1200px] mx-auto px-4 py-8 mt-20">
        <div className="mb-6"><Breadcrumbs items={[{ label: "Clubs", href: "/clubs" }, ...(f.state ? [{ label: f.state }] : [])]} /></div>

        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/clubs/events", title: "Events and DJ nights", note: "Upcoming nights at partner clubs" },
            { href: "/clubs/lottery", title: "Ticket draw", note: "Enter with wallet points" },
            { href: "/clubs/dj-demand", title: "Demand your DJ", note: "Pledge toward a booking" },
            { href: "/clubs/my-bookings", title: "My bookings", note: "Guest list and VIP requests" },
          ].map((x) => (
            <Link key={x.href} href={x.href} className="bg-white border border-gray-200 p-4 hover:border-black transition-colors">
              <div className="font-bold text-sm">{x.title}</div>
              <div className="text-xs text-gray-500 mt-1">{x.note}</div>
            </Link>
          ))}
        </div>

        <section className="bg-white border border-gray-200 p-5 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#111]">Pubs, bars and nightclubs in {place}</h1>
          <p className="text-[#555] mt-2">Find a place in three taps: country, city, area. Then open it for the guest list or a VIP table.</p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search a venue, area or city (try Marina, Bandra, Koramangala)" aria-label="Search venues"
                className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-xl text-base outline-none focus:border-[#ed6c2a]" />
            </div>
            <button type="button" onClick={nearMe} className="h-12 px-5 rounded-xl border border-gray-300 font-semibold text-sm flex items-center justify-center gap-2 hover:border-[#ed6c2a]"><Crosshair className="w-4 h-4" /> Near me</button>
            <button type="button" onClick={() => setOpen(true)} className="lg:hidden h-12 px-5 rounded-xl bg-[#222] text-white font-semibold text-sm flex items-center justify-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters{active.length ? ` (${active.length})` : ""}</button>
          </div>
          {geoError && <p className="text-sm text-amber-700 mt-2">{geoError}</p>}

          <div className="mt-6 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8">
            <aside className="hidden lg:block border-r border-gray-100 pr-6 self-start sticky top-24"><div className="flex items-center gap-2 mb-4 font-bold"><Globe2 className="w-5 h-5 text-[#ed6c2a]" /> Filters</div>{filters}</aside>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-gray-600 mr-1"><b>{results.length}</b> venue{results.length === 1 ? "" : "s"}</span>
                {active.map((a) => <span key={a} className="text-xs bg-gray-100 border border-gray-200 rounded-full px-3 py-1">{a}</span>)}
                {active.length > 0 && <button onClick={() => { setF({ ...EMPTY }); setVisible(24); }} className="text-xs underline text-gray-600 flex items-center gap-1"><X className="w-3 h-3" /> Clear all</button>}
                <select value={f.sort} onChange={(e) => (e.target.value === "near" ? nearMe() : set({ sort: e.target.value as Sort }))} aria-label="Sort" className="ml-auto border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="top">Best listed first</option><option value="az">A to Z</option><option value="near">Nearest to me</option>
                </select>
              </div>

              {results.length === 0 ? (
                <div className="py-14 text-center border border-dashed border-gray-300 rounded-xl">
                  <h2 className="text-xl font-bold text-gray-700">No venues match</h2>
                  <p className="text-sm text-gray-500 mt-1">Try removing a filter.</p>
                  <button onClick={() => { setF({ ...EMPTY }); setVisible(24); }} className="mt-4 px-5 py-2 rounded-lg bg-[#222] text-white text-sm font-semibold">Clear all filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
                  {results.slice(0, visible).map((club) => {
                    const km = dist(club);
                    return (
                      <div key={club.id} className="flex flex-col">
                        <Link href={`/clubs/venue/${club.id}`} className="relative h-40 sm:h-48 w-full mb-3 group overflow-hidden block rounded-lg">
                          <ClubPhoto src={club.image} name={club.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute top-0 left-0 bg-[#ed6c2a] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">{club.suburb || club.city}, {countryOf(club.state) === "United Arab Emirates" ? "UAE" : club.state}</div>
                          {km !== null && <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs font-semibold rounded-full px-2.5 py-1">{km < 10 ? km.toFixed(1) : Math.round(km)} km away</div>}
                        </Link>
                        <Link href={`/clubs/venue/${club.id}`}><h3 className="text-lg font-bold hover:text-[#ed6c2a] transition-colors">{club.name}</h3></Link>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{[club.venueType && club.venueType[0].toUpperCase() + club.venueType.slice(1), club.city].filter(Boolean).join(" · ")}</p>
                        {club.description && <p className="text-[#666] text-sm mt-2 line-clamp-2">{club.description}</p>}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Link href={`/clubs/${toSlug(club.state)}/${club.id}/guest-list`} className="bg-[#ed6c2a] hover:bg-[#d85e21] text-white text-center font-bold py-2.5 text-sm transition-colors">GUEST LIST</Link>
                          <Link href={`/clubs/${toSlug(club.state)}/${club.id}/vip-tables`} className="bg-[#222] hover:bg-black text-white text-center font-bold py-2.5 text-sm transition-colors">VIP TABLES</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {results.length > visible && (
                <div className="pt-8 text-center">
                  <p className="text-xs text-gray-500 mb-3">Showing {visible} of {results.length}</p>
                  <button onClick={() => setVisible((n) => n + 24)} className="px-8 py-3 border border-gray-300 text-sm font-bold uppercase tracking-widest hover:border-[#ed6c2a] hover:text-[#ed6c2a]">Show more</button>
                </div>
              )}
            </div>
          </div>
        </section>

        <nav aria-label="Browse by city" className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">City guides</h2>
          <div className="flex flex-wrap gap-2">
            {["Mumbai", "Pune", "Delhi", "Gurgaon", "Noida", "Bengaluru", "Thane", "Navi Mumbai", "Dubai", "Abu Dhabi", "Sharjah"].map((c) => (
              <Link key={c} href={`/clubs/city/${toSlug(c)}`} className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-gray-300 hover:border-black">Pubs and clubs in {c}</Link>
            ))}
          </div>
        </nav>
      </main>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[3000] bg-black/60 flex items-end" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="bg-white w-full max-h-[85dvh] overflow-auto rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-lg">Filters</h2><button onClick={() => setOpen(false)} aria-label="Close" className="p-2"><X className="w-5 h-5" /></button></div>
            {filters}
            <button onClick={() => setOpen(false)} className="mt-6 w-full h-12 rounded-xl bg-[#ed6c2a] text-white font-bold">Show {results.length} venue{results.length === 1 ? "" : "s"}</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
