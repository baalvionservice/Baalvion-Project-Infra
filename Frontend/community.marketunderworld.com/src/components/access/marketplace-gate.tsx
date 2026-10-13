import { cookies } from "next/headers"
import Link from "next/link"
import { Lock } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

/**
 * Wraps the marketplace pages. Anyone can browse the marketplace, signed in or not, so listings can be seen and found.
 * Buying is what needs the one-time access pass (a seller with an active category or an admin also qualifies). That rule
 * is enforced on the server when an order is placed, so it holds whatever this page shows; this wrapper only tells a
 * visitor what they need in order to buy.
 */
export async function MarketplaceGate({ children, returnTo, withNav = false }: { children: React.ReactNode; returnTo: string; withNav?: boolean }) {
  const token = (await cookies()).get("access_token")?.value
  let hasAccess = false
  let price = 50
  if (token) {
    try {
      const res = await fetch(`${process.env.COMMERCE_UPSTREAM_URL ?? ""}/buyer-access/me`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" })
      if (res.ok) {
        const body = await res.json()
        hasAccess = !!body.data?.hasAccess
        price = body.data?.priceUsd ?? price
      }
    } catch { /* browsing still works; the notice below just stays generic */ }
  }
  // The shop pages carry no site menu or footer of their own, so they get them here; the marketplace pages bring theirs.
  if (hasAccess) return withNav ? <><Navbar /><div className="pt-24">{children}</div><Footer /></> : <>{children}</>

  return (
    <>
      {withNav && <Navbar />}
      {/* Sits under the fixed ticker and top menu, above the page. */}
      <div className="bg-[#0b0b10] border-b border-white/10 text-gray-200 pt-24 sm:pt-28 pb-3 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Lock className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="flex-1 min-w-[16rem]">You are browsing as a visitor. Anyone can look around. To <strong>buy</strong>, you need a Hell Road account and the one-time ${price} access pass.</span>
          {token
            ? <Link href="/buyer-pass" className="shrink-0 h-9 px-4 rounded-lg bg-[#39FF14] text-black font-bold inline-flex items-center hover:bg-[#2BE010]">Get my access pass</Link>
            : <Link href={`/auth/signin?redirect=${encodeURIComponent(returnTo)}`} className="shrink-0 h-9 px-4 rounded-lg bg-white text-black font-bold inline-flex items-center hover:bg-gray-200">Sign in to buy</Link>}
        </div>
      </div>
      {children}
      {withNav && <Footer />}
    </>
  )
}
