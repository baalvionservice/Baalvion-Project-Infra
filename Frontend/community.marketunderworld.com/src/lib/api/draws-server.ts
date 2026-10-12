// Server-side read of the public draws, for pages that must be in the HTML for search engines.
import { MARKET_UNDERWORLD_STORE_ID } from "./commerce"
import { memo } from "../server-cache"
import type { Draw } from "./engagement"

const API = process.env.NEXT_PUBLIC_API_ORIGIN ?? "https://api.baalvion.com"

export async function getDraws(): Promise<Draw[]> {
  try {
    return await memo("draws:public", 60_000, async () => {
      const res = await fetch(`${API}/api/v1/commerce/storefront/${MARKET_UNDERWORLD_STORE_ID}/engagement/lottery`, { cache: "no-store" })
      if (!res.ok) return []
      const body = await res.json().catch(() => null)
      return ((body?.data?.items ?? body?.items) as Draw[]) ?? []
    })
  } catch { return [] }
}

export const getDraw = async (id: string) => (await getDraws()).find((d) => d.id === id) ?? null

// Entry price in dollars from the points (100 points = $1).
export const priceLabel = (points: number) => (points === 0 ? "Free entry" : `$${(points / 100).toFixed(2).replace(/\.00$/, "")} per entry`)
