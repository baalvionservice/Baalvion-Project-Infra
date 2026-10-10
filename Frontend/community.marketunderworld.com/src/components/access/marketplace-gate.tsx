import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Lock } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

/**
 * Wraps the marketplace pages. Signed-out visitors are sent to sign in; signed-in people without an
 * access pass (and who are not a seller or admin) see the paywall. The check happens on the server
 * against the commerce service, so the page content is never sent to someone without access.
 */
export async function MarketplaceGate({ children, returnTo }: { children: React.ReactNode; returnTo: string }) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#050508] text-white pt-32 pb-32">
          <div className="max-w-xl mx-auto px-6 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold">Login to browse</h1>
            <p className="text-gray-400">The marketplace is reserved for members. Please sign in to browse and access premium products.</p>
            <Link href={`/auth/signin?redirect=${encodeURIComponent(returnTo)}`} className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">Sign in</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  let hasAccess = false
  let price = 50
  let unavailable = false
  try {
    const res = await fetch(`${process.env.COMMERCE_UPSTREAM_URL ?? ""}/buyer-access/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (res.status === 401) redirect(`/auth/signin?redirect=${encodeURIComponent(returnTo)}`)
    if (res.ok) {
      const body = await res.json()
      hasAccess = !!body.data?.hasAccess
      price = body.data?.priceUsd ?? price
    } else {
      unavailable = true
    }
  } catch (err) {
    // redirect() throws a special error that must pass through.
    if (err && typeof err === "object" && "digest" in err) throw err
    unavailable = true
  }

  if (hasAccess) return <>{children}</>

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-[#050508] text-white pt-32 pb-32">
      <div className="max-w-xl mx-auto px-6 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"><Lock className="w-7 h-7 text-gray-400" /></div>
        {unavailable ? (
          <>
            <h1 className="text-3xl font-bold">We can&apos;t check your access right now</h1>
            <p className="text-gray-400">Please try again in a moment.</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Members only</h1>
            <p className="text-gray-400">The marketplace is open to members. A one-time ${price} access pass lets you browse every category and buy anything listed by our sellers.</p>
            <Link href="/buyer-pass" className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-[#39FF14] text-black font-bold hover:bg-[#2BE010] transition-colors">Get my access pass — ${price}</Link>
          </>
        )}
      </div>
    </div>
    <Footer />
    </>
  )
}
