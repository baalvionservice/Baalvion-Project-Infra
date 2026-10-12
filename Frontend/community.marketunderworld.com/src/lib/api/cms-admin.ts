// Staff-written page content. Same-origin community bridge (the console is signed in as staff).
import type { SitePage } from "../cms"

const BASE = "/api/community-proxy"
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) }, credentials: "include", cache: "no-store" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) throw Object.assign(new Error(body.error?.message || `Request failed (${res.status})`), { status: res.status })
  return body.data as T
}
export interface PageRow { slug: string; title: string; hasSeo: boolean; noindex: boolean; updatedAt: string }
export const cmsAdmin = {
  list: () => call<{ items: PageRow[] }>("/admin/pages").then((r) => r.items),
  get: (slug: string) => call<SitePage>(`/admin/pages?slug=${encodeURIComponent(slug)}`).catch((e: { status?: number }) => (e.status === 404 ? null : Promise.reject(e))),
  save: (p: Partial<SitePage> & { slug: string }) => call<SitePage>("/admin/pages", { method: "PUT", body: JSON.stringify(p) }),
}
