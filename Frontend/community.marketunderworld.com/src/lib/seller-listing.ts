import type { CommerceProduct } from "@/lib/api/commerce-admin"

export type ListingStatus = CommerceProduct["status"]

// Where a listing is in its life, in the seller's words.
export const STATUS_COPY: Record<ListingStatus, { label: string; next: string }> = {
  draft: { label: "Draft", next: "Only you can see this. Finish it and submit it for review." },
  pending_review: { label: "In review", next: "An admin is checking it. It goes live as soon as it's approved." },
  approved: { label: "Approved", next: "Approved and waiting to go live." },
  published: { label: "Live", next: "Visible to marketplace members." },
  rejected: { label: "Needs changes", next: "An admin sent this back. Fix it and submit again." },
  archived: { label: "Archived", next: "Hidden from the marketplace." },
}

export const defaultVariantPrice = (p: Pick<CommerceProduct, "variants">): number | null => {
  const v = (p.variants ?? []).find((x) => x.isDefault) ?? (p.variants ?? [])[0]
  if (!v) return null
  const n = Number(v.price)
  return Number.isFinite(n) ? n : null
}

export interface Readiness { ready: boolean; missing: string[] }

// What an admin needs to see before a listing can be reviewed.
export function listingReadiness(input: { name: string; categoryId: string; shortDescription: string; price: number | null; photos: number }): Readiness {
  const missing: string[] = []
  const name = input.name.trim()
  if (!name || /^untitled listing$/i.test(name)) missing.push("A real listing name")
  if (!input.categoryId) missing.push("A category")
  if (!input.price || input.price <= 0) missing.push("A price")
  if (input.photos < 1) missing.push("At least one photo")
  if (input.shortDescription.trim().length < 10) missing.push("A short description")
  return { ready: missing.length === 0, missing }
}

export const money = (n: number | null, currency = "USD") =>
  n == null ? "—" : `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
