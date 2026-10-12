// Dating profiles for verified adults. Same-origin community bridge.
const BASE = "/api/community-proxy"

export interface DatingProfile {
  id: string; name: string; age: number; headline: string; bio: string; city: string
  isFounder: boolean; company: string; role: string; lookingFor: string; interests: string[]; photoPath: string | null
}
export interface MyDating { verified: boolean; profile: (DatingProfile & { active: boolean; hidden: boolean }) | null }
export interface DatingInput {
  displayName: string; headline?: string; bio?: string; city?: string; isFounder?: boolean; companyName?: string; roleTitle?: string
  lookingFor?: string; interests?: string[]; photoAssetId?: string | null; active?: boolean
}
export class DatingError extends Error { constructor(m: string, public code?: string) { super(m) } }

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) }, credentials: "include", cache: "no-store" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.success === false) throw new DatingError(body.error?.message || `Request failed (${res.status})`, body.error?.code)
  return body.data as T
}

export const dating = {
  mine: () => call<MyDating>("/dating/me"),
  save: (d: DatingInput) => call<MyDating>("/dating/me", { method: "PUT", body: JSON.stringify(d) }),
  discover: (f: { city?: string; founders?: boolean } = {}) =>
    call<{ items: DatingProfile[] }>(`/dating/discover?${new URLSearchParams({ ...(f.city ? { city: f.city } : {}), ...(f.founders ? { founders: "1" } : {}) })}`).then((r) => r.items),
  act: (id: string, action: "like" | "pass") => call<{ matched: boolean; conversationId: string | null }>(`/dating/${id}/act`, { method: "POST", body: JSON.stringify({ action }) }),
  matches: () => call<{ items: (DatingProfile & { conversationId: string })[] }>("/dating/matches").then((r) => r.items),
  report: (id: string, reason: string) => call<{ ok: boolean }>(`/dating/${id}/report`, { method: "POST", body: JSON.stringify({ reason }) }),
}
export const datingPhoto = (path: string | null) => (path ? `${BASE}${path}` : null)

export interface AdminDating extends DatingProfile { userId: string; status: string; hiddenReason: string | null }
export const datingAdmin = {
  list: () => call<{ items: AdminDating[] }>("/admin/dating").then((r) => r.items),
  hide: (id: string, hidden: boolean, reason?: string) => call<{ ok: boolean }>(`/admin/dating/${id}/hide`, { method: "POST", body: JSON.stringify({ hidden, reason }) }),
}
