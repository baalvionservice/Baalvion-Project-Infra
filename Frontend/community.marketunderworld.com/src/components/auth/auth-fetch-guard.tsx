"use client"

import { useEffect } from "react"

// Sign-in tokens last about 15 minutes. When a call to the site's own API comes back 401 because the token ran out,
// renew it once (every call waiting at the same moment shares that single renewal) and repeat the call. Without this a
// member who keeps a tab open sees pages break with "bearer token required" even though they are still signed in.
let renewing: Promise<boolean> | null = null
function renew(): Promise<boolean> {
  if (!renewing) {
    renewing = fetch("/auth-bff/auth/refresh", { method: "POST", credentials: "include", headers: { "content-type": "application/json" } })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => { setTimeout(() => { renewing = null }, 1500) })
  }
  return renewing
}

export function AuthFetchGuard() {
  useEffect(() => {
    const original = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await original(input, init)
      if (res.status !== 401) return res
      let path = ""
      try { path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.origin).pathname } catch { return res }
      if (!/^\/api\/[a-z-]+-proxy\//.test(path)) return res
      if (init?.body instanceof ReadableStream || (typeof Request !== "undefined" && input instanceof Request)) return res
      return (await renew()) ? original(input, init) : res
    }
    return () => { window.fetch = original }
  }, [])
  return null
}
