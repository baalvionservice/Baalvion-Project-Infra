"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getMyMember } from "@/lib/api/members"
import { getMyProfile } from "@/lib/api/profile"
import { kyc } from "@/lib/api/kyc"
import { INTERESTS } from "@/lib/interests"

export interface SetupItem { key: string; label: string; done: boolean; href: string }
export interface Setup { items: SetupItem[]; done: number; total: number; complete: boolean; next: SetupItem | null; interests: string[]; profileReady: boolean }

let cache: Promise<Setup> | null = null

// What a new member still needs to do to be set up. Shared by the account menu, the footer, the dashboard and the sign-in landing.
async function load(): Promise<Setup> {
  const [member, profile, kycCase] = await Promise.all([getMyMember().catch(() => null), getMyProfile().catch(() => null), kyc.mine().catch(() => null)])
  const items: SetupItem[] = [
    { key: "name", label: "Choose the name other members see", done: !!member?.customName, href: "/onboarding" },
    { key: "photo", label: "Add a profile photo", done: !!profile?.photoPath, href: "/onboarding" },
    { key: "about", label: "Tell us your city and a line about you", done: !!(profile?.city && profile?.bio), href: "/onboarding" },
    { key: "interests", label: "Choose what you want here", done: (profile?.interests.length ?? 0) > 0, href: "/onboarding" },
    { key: "kyc", label: "Verify your identity (KYC)", done: kycCase?.status === "approved", href: "/kyc" },
  ]
  const done = items.filter((i) => i.done).length
  return {
    items, done, total: items.length, complete: done === items.length, next: items.find((i) => !i.done) ?? null,
    interests: profile?.interests ?? [], profileReady: !!member?.customName && (profile?.interests.length ?? 0) > 0,
  }
}

export const resetSetup = () => { cache = null; if (typeof window !== "undefined") window.dispatchEvent(new Event("hr-setup-changed")) }
export const loadSetup = () => (cache ??= load().catch((e) => { cache = null; throw e }))

export function useSetup(): { setup: Setup | null; reload: () => void } {
  const { isAuthenticated } = useAuth()
  const [setup, setSetup] = useState<Setup | null>(null)
  const reload = useCallback(() => { if (isAuthenticated) loadSetup().then(setSetup).catch(() => setSetup(null)) }, [isAuthenticated])
  useEffect(() => {
    reload()
    window.addEventListener("hr-setup-changed", reload)
    return () => window.removeEventListener("hr-setup-changed", reload)
  }, [reload])
  return { setup: isAuthenticated ? setup : null, reload }
}

// Where each thing a member said they want actually starts.
export const DESTINATIONS: Record<string, { href: string; label: string }> = {
  clubs: { href: "/clubs", label: "Browse clubs and events" },
  forum: { href: "/forum/join", label: "Join the forum" },
  locals: { href: "/locals", label: "See locals jobs and gigs" },
  buy: { href: "/marketplace", label: "Open the marketplace" },
  sell: { href: "/seller/onboarding", label: "Apply to sell" },
  wallet: { href: "/clubs/lottery", label: "Enter the ticket draw" },
  trade: { href: "/escrow/intermediaries", label: "Find an intermediary" },
  agent: { href: "/escrow/apply-agent", label: "Apply as an intermediary" },
  learn: { href: "/education", label: "Open education" },
  student: { href: "/student-dashboard", label: "Open your student dashboard" },
  teacher: { href: "/teacher-dashboard", label: "Open your teacher dashboard" },
  employer: { href: "/nightlife/employer", label: "Register your business to hire" },
  dating: { href: "/dating", label: "Open dating" },
  elite_paid: { href: "/access", label: "Choose your membership" },
  elite_invite: { href: "/clubs/elite-host", label: "Ask hosts for an invitation" },
  ticketseller: { href: "/clubs/events/submit", label: "Post your ticketed event" },
  organiser: { href: "/clubs/events/submit", label: "Post your event" },
}
export const interestTitle = (id: string) => INTERESTS.find((i) => i.id === id)?.title ?? id

// After signing in: finish setup first if this is a new member, then the page they were trying to reach, then what they said they want.
export async function pathAfterLogin(redirect: string | null, isAdmin: boolean): Promise<string> {
  const safe = redirect && redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.startsWith("/auth/") ? redirect : null
  if (isAdmin) return safe ?? "/admin"
  resetSetup()
  try {
    const s = await loadSetup()
    if (!s.profileReady) return `/onboarding${safe ? `?next=${encodeURIComponent(safe)}` : ""}`
    if (safe) return safe
    const first = s.interests.find((i) => DESTINATIONS[i])
    return first ? DESTINATIONS[first].href : "/dashboard"
  } catch { return safe ?? "/dashboard" }
}
