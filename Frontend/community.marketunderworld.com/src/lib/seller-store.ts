import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"
import type { CommerceStoreSummary } from "@/lib/api/commerce-admin"

// A person can own several stores on the platform (an admin owns them all). Sellers here list in the Hell Road marketplace,
// so that store comes first; anything else only if it is the single store they have.
export function pickMarketStore<T extends Pick<CommerceStoreSummary, "id">>(stores: T[]): T | undefined {
  return stores.find((s) => s.id === MARKET_UNDERWORLD_STORE_ID) ?? (stores.length === 1 ? stores[0] : undefined) ?? stores[0]
}

// The public address of a listing, once its category is known.
export const publicListingPath = (categorySlug: string | undefined, slug: string | undefined) =>
  categorySlug && slug ? `/shop/${categorySlug}/${slug}` : null
