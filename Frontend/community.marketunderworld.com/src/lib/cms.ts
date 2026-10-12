// Page content and SEO written by staff in /admin/content. Read on the server so crawlers see it in the HTML.
import type { Metadata } from "next"
import { memo } from "./server-cache"

const DIRECT_BASE = process.env.NEXT_PUBLIC_COMMUNITY_API_BASE ?? "https://api.baalvion.com/api/v1/community"
export const SITE_URL = "https://community.marketunderworld.com"

export interface SitePage {
  slug: string; title: string; seoTitle: string; seoDescription: string; intro: string; body: string
  benefits: { title: string; text: string }[]; faqs: { q: string; a: string }[]; image: string; noindex: boolean
}

export async function getPage(slug: string): Promise<SitePage | null> {
  const key = slug.replace(/^\/+|\/+$/g, "").toLowerCase()
  try {
    return await memo(`page:${key}`, 60_000, async () => {
      const res = await fetch(`${DIRECT_BASE}/pages?slug=${encodeURIComponent(key)}`, { cache: "no-store" })
      if (!res.ok) return null
      const body = await res.json().catch(() => null)
      return (body?.data as SitePage) ?? null
    })
  } catch { return null }
}

export async function listWrittenPages(): Promise<{ slug: string; noindex: boolean; updatedAt: string }[]> {
  try {
    return await memo("pages:list", 300_000, async () => {
      const res = await fetch(`${DIRECT_BASE}/pages`, { cache: "no-store" })
      if (!res.ok) return []
      const body = await res.json().catch(() => null)
      return (body?.data?.items as { slug: string; noindex: boolean; updatedAt: string }[]) ?? []
    })
  } catch { return [] }
}

// Search title and description: what staff wrote, else the page's own defaults.
export async function pageMetadata(slug: string, fallback: { title: string; description: string }, opts: { noindex?: boolean } = {}): Promise<Metadata> {
  const p = await getPage(slug)
  const title = p?.seoTitle || fallback.title
  const description = p?.seoDescription || fallback.description
  const path = `/${slug.replace(/^\/+/, "")}`
  const noindex = opts.noindex || p?.noindex
  return {
    title, description,
    alternates: { canonical: path === "/" ? "/" : path },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, type: "website", url: `${SITE_URL}${path}`, ...(p?.image ? { images: [p.image] } : {}) },
  }
}

export const noindexMetadata: Metadata = { robots: { index: false, follow: false } }
