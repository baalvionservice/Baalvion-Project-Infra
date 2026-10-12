// Public people pages, read on the server so search engines get them in the HTML.
import { memo } from "./server-cache"

const BASE = process.env.NEXT_PUBLIC_COMMUNITY_API_BASE ?? "https://api.baalvion.com/api/v1/community"
export interface PersonCard { handle: string; name: string; headline: string; city: string; isFounder: boolean; company: string; role: string; photoPath: string | null; searchIndex: boolean; updatedAt: string }
export interface PersonPage extends PersonCard { bio: string; knownFor: string; interests: string[]; links: Record<string, string>; verified: boolean; since: string }

export async function getPerson(handle: string): Promise<PersonPage | null> {
  try {
    const res = await fetch(`${BASE}/p/${encodeURIComponent(handle)}`, { cache: "no-store" })
    if (!res.ok) return null
    return ((await res.json()).data as PersonPage) ?? null
  } catch { return null }
}

export async function listPeople(o: { founders?: boolean; city?: string; q?: string; limit?: number; offset?: number } = {}): Promise<{ items: PersonCard[]; total: number }> {
  const qs = new URLSearchParams({ limit: String(o.limit ?? 48), offset: String(o.offset ?? 0), ...(o.founders ? { founders: "1" } : {}), ...(o.city ? { city: o.city } : {}), ...(o.q ? { q: o.q } : {}) })
  try {
    return await memo(`people:${qs}`, 60_000, async () => {
      const res = await fetch(`${BASE}/p?${qs}`, { cache: "no-store" })
      if (!res.ok) return { items: [], total: 0 }
      const d = (await res.json()).data as { items: PersonCard[]; total: number }
      return d ?? { items: [], total: 0 }
    })
  } catch { return { items: [], total: 0 } }
}

// Every indexable public page, for the sitemap.
export async function allIndexablePeople(): Promise<PersonCard[]> {
  const { items } = await listPeople({ limit: 5000 })
  return items.filter((p) => p.searchIndex)
}

export const personTitle = (p: { name: string; role: string; company: string; isFounder: boolean; headline: string; city: string }) =>
  [p.name, p.isFounder ? [p.role || "Founder", p.company].filter(Boolean).join(" at ") : p.headline].filter(Boolean).join(", ") + (p.city ? ` in ${p.city}` : "")
