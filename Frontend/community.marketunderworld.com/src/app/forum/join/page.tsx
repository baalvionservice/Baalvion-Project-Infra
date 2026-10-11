"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getCommunities, joinCommunity, type Community, type CommunityAccessModel } from "@/lib/api/community"

const ACCESS_TEXT: Record<CommunityAccessModel, { label: string; note: string }> = {
  free: { label: "Open", note: "Anyone with an account can join straight away." },
  request_approval: { label: "By request", note: "Send a short request. A moderator reads it and approves or declines." },
  invite_only: { label: "Invitation only", note: "You can only join with an invitation from a moderator or member." },
  paid: { label: "Paid", note: "Unlocked with a paid access tier." },
}

// Plain conduct rules. The Terms of use stay the binding document; these are the short version.
const RULES = [
  "Be respectful. No harassment, threats or hate.",
  "Post only what you are allowed to share. No stolen data, no one's private details, nothing illegal.",
  "No scams or fraud, and no offering or asking for help to commit them.",
  "Do not spam or advertise without a moderator's permission.",
  "Money and trades with other members are at your own risk. Use the listed intermediaries for trades.",
  "Moderators can remove posts and members who break these rules.",
]

const STEPS = ["What you want", "Rules and terms", "Access and payment"]
const KEY = "hr_forum_onboarding"

export default function ForumJoinPage() {
  const { isAuthenticated } = useAuth()
  const [step, setStep] = useState(0)
  const [communities, setCommunities] = useState<Community[] | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [learn, setLearn] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [message, setMessage] = useState("")
  const [state, setState] = useState<Record<string, { busy?: boolean; ok?: string; error?: string }>>({})

  useEffect(() => {
    getCommunities().then((all) => setCommunities(all.filter((c) => c.isForum)))
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}")
      if (Array.isArray(saved.picked)) setPicked(saved.picked)
      if (typeof saved.learn === "string") setLearn(saved.learn)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ picked, learn })) } catch { /* ignore */ }
  }, [picked, learn])

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]))
  const chosen = (communities || []).filter((c) => picked.includes(c.slug))

  const join = async (c: Community) => {
    setState((s) => ({ ...s, [c.slug]: { busy: true } }))
    try {
      const r = await joinCommunity(c.slug, c.accessModel === "request_approval" ? message || undefined : undefined)
      const st = r.membership.status
      setState((s) => ({ ...s, [c.slug]: { ok: st === "approved" || st === "paid" ? "You are in." : "Request sent. A moderator will review it." } }))
    } catch (e) {
      setState((s) => ({ ...s, [c.slug]: { error: e instanceof Error ? e.message : "Could not join" } }))
    }
  }

  return (
    <div className="baal-page pt-10 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Get started in the forum</h1>
        <p className="text-gray-400 mt-2">Three short steps: tell us what you want, read the rules, then see exactly how access and payment work.</p>

        <ol className="mt-6 grid grid-cols-3 gap-2 text-center text-xs" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className={`rounded-lg border px-2 py-2.5 ${i < step ? "border-emerald-700 text-emerald-300" : i === step ? "border-red-500 text-white font-bold" : "border-white/10 text-gray-500"}`}>{i + 1}. {s}</li>
          ))}
        </ol>

        {step === 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-white">Which communities interest you?</h2>
            {communities === null ? <div className="mt-4 text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {communities.map((c) => {
                  const on = picked.includes(c.slug)
                  return (
                    <button key={c.slug} onClick={() => toggle(c.slug)} aria-pressed={on} className={`text-left rounded-xl border p-4 ${on ? "border-red-500 bg-red-950/30" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
                      <div className="flex justify-between gap-3"><span className="font-semibold text-white">{c.name}</span><span className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center ${on ? "bg-red-600 border-red-600" : "border-white/30"}`}>{on && <Check className="w-3.5 h-3.5" />}</span></div>
                      <p className="text-sm text-gray-400 mt-1">{c.description || "A moderated community."}</p>
                      <p className="text-xs text-gray-500 mt-2">{ACCESS_TEXT[c.accessModel].label}</p>
                    </button>
                  )
                })}
              </div>
            )}
            <label className="block mt-6 text-sm text-gray-300">What do you most want to learn or get from the forum? (optional)
              <textarea value={learn} onChange={(e) => setLearn(e.target.value)} rows={3} maxLength={500} className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white" placeholder="For example: how to start trading, how to stay safe online, how to find investors" />
            </label>
            <p className="text-xs text-gray-500 mt-1">Kept in this browser only. It is not sent to anyone.</p>
            <button disabled={picked.length === 0} onClick={() => setStep(1)} className="mt-6 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-lg">Continue</button>
          </section>
        )}

        {step === 1 && (
          <section className="mt-8" id="terms">
            <h2 className="text-xl font-bold text-white">Rules and terms</h2>
            <ul className="mt-4 space-y-2 text-gray-300 text-sm list-disc pl-5">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>
            <p className="mt-4 text-sm text-gray-400">These are the short version. The full documents apply: <Link className="underline" href="/terms">Terms of use</Link>, <Link className="underline" href="/privacy">Privacy policy</Link> and <Link className="underline" href="/refund-policy">Refund policy</Link>.</p>
            <label className="mt-5 flex items-start gap-3 text-sm text-gray-200">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-red-600" />
              I have read and accept the forum rules, the Terms of use and the Privacy policy.
            </label>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(0)} className="border border-white/20 text-white px-5 py-2.5 rounded-lg">Back</button>
              <button disabled={!agreed} onClick={() => setStep(2)} className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-lg">Continue</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-white">Access and payment</h2>
            {!isAuthenticated && <p className="mt-3 text-sm text-amber-200">You need an account to join. <Link className="underline" href="/auth/registration">Create one</Link> or <Link className="underline" href="/auth/signin?redirect=/forum/join">sign in</Link>, then come back here. Your choices are saved.</p>}
            <div className="mt-4 space-y-3">
              {chosen.map((c) => {
                const st = state[c.slug] || {}
                const can = c.accessModel === "free" || c.accessModel === "request_approval"
                return (
                  <div key={c.slug} className="rounded-xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><div className="font-semibold text-white">{c.name}</div><div className="text-sm text-gray-400">{ACCESS_TEXT[c.accessModel].label}: {ACCESS_TEXT[c.accessModel].note}</div></div>
                      {can && isAuthenticated && !st.ok && <button disabled={st.busy} onClick={() => join(c)} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg">{c.accessModel === "free" ? "Join now" : "Send request"}</button>}
                      {st.ok && <Link href={`/forum/${c.slug}`} className="text-sm text-emerald-300 underline">{st.ok} Open it</Link>}
                    </div>
                    {c.accessModel === "request_approval" && isAuthenticated && !st.ok && (
                      <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} placeholder="Why do you want to join? (helps the moderator)" className="mt-3 w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white" />
                    )}
                    {st.error && <p className="mt-2 text-sm text-red-300">{st.error}</p>}
                  </div>
                )
              })}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 p-4 text-sm text-gray-300">
              <div className="font-semibold text-white mb-1">Paying for more access</div>
              <p>Joining these communities does not cost anything. Platform-wide access tiers (Marketplace, Global Elite and VIP) are paid in crypto from the <Link className="underline" href="/access">Access page</Link>, which lists each tier, its price and what it unlocks. For the marketplace you can also load your wallet from <Link className="underline" href="/payments">Payments</Link>. Before you pay, read the <Link className="underline" href="/refund-policy">Refund policy</Link>.</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="border border-white/20 text-white px-5 py-2.5 rounded-lg">Back</button>
              <Link href="/forum" className="bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 rounded-lg">Go to the forum</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
