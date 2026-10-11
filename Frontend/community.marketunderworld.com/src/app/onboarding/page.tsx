"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { saveMyProfile } from "@/lib/api/profile"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

type Need = { id: string; title: string; what: string; needed: string; cta: string; href: string }

// Each choice says what it gives you and what it takes, using only things the site really does.
const NEEDS: Need[] = [
  { id: "clubs", title: "Clubs, guest lists and events", what: "Browse clubs, ask for the guest list or a VIP table, see DJ nights.", needed: "Just an account.", cta: "Open clubs", href: "/clubs" },
  { id: "forum", title: "Forum and community", what: "Read and post in the forum categories.", needed: "Just an account.", cta: "Open the forum", href: "/forum" },
  { id: "locals", title: "Locals: jobs and gigs", what: "Find casting calls and local gigs, or post as an employer.", needed: "An account. Employers and candidates are reviewed.", cta: "Open locals", href: "/locals" },
  { id: "buy", title: "Buy on the marketplace", what: "Buy from sellers and pay with your wallet points.", needed: "A buyer pass, then load your wallet (100 points = $1).", cta: "Get the buyer pass", href: "/buyer-pass" },
  { id: "sell", title: "Sell on the marketplace", what: "Open a seller account and list products.", needed: "A seller application, reviewed by an admin, and a category deposit.", cta: "Apply to sell", href: "/seller/onboarding" },
  { id: "wallet", title: "Ticket draws and DJ demands", what: "Enter draws and pledge toward the DJs you want.", needed: "Wallet points. Load them with crypto and an admin confirms.", cta: "Load your wallet", href: "/payments" },
  { id: "trade", title: "Buy USDT or get help with a trade", what: "Pick a listed intermediary and trade with them directly.", needed: "An account. You pay the intermediary by scanning their QR.", cta: "See intermediaries", href: "/escrow/intermediaries" },
  { id: "agent", title: "Work as an intermediary", what: "Help members buy USDT and trade, and earn your own fee.", needed: "A refundable $1,000 deposit, confirmed by an admin, and your payment QR.", cta: "Apply as an intermediary", href: "/escrow/apply-agent" },
  { id: "learn", title: "Learn or teach", what: "Courses and live sessions.", needed: "An account. Teachers are approved by an admin.", cta: "Open education", href: "/education" },
]

const KEY = "hr_access_needs"

export default function OnboardingPage() {
  const { isAuthenticated } = useAuth()
  const [picked, setPicked] = useState<string[]>([])

  useEffect(() => {
    try { setPicked(JSON.parse(localStorage.getItem(KEY) || "[]")) } catch { /* ignore */ }
  }, [])

  const toggle = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
    setPicked(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
    if (isAuthenticated) saveMyProfile({ interests: next }).catch(() => {})
  }
  const chosen = NEEDS.filter((n) => picked.includes(n.id))

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-white">
      <Navbar />
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-32 pb-16">
        <h1 className="text-3xl font-bold">What do you want to do here?</h1>
        <p className="text-gray-400 mt-2 max-w-2xl">Tick everything that applies. We will show exactly what each one needs, so you only do the steps you need. When you are signed in your choices are saved to your profile, and you can change them any time on your dashboard.</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NEEDS.map((n) => {
            const on = picked.includes(n.id)
            return (
              <button key={n.id} onClick={() => toggle(n.id)} aria-pressed={on}
                className={`text-left rounded-xl border p-4 transition-colors ${on ? "border-red-500 bg-red-950/30" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold">{n.title}</div>
                  <span className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center ${on ? "bg-red-600 border-red-600" : "border-white/30"}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{n.what}</p>
              </button>
            )
          })}
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Your next steps</h2>
          {chosen.length === 0 ? (
            <p className="text-gray-500 mt-2 text-sm">Pick what you need above and your steps will appear here.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {chosen.map((n, i) => (
                <li key={n.id} className="rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{i + 1}. {n.title}</div>
                    <p className="text-sm text-gray-400 mt-0.5"><span className="text-gray-300">What it takes:</span> {n.needed}</p>
                  </div>
                  <Link href={n.href} className="self-start sm:self-center whitespace-nowrap bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">{n.cta}</Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
