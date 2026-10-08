import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { BadgeCheck, CalendarDays, PackageCheck, Star, Store, Boxes } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { getPublicMember } from "@/lib/api/members"

type Props = { params: Promise<{ memberNumber: string; slug?: string[] }> }

// Member profiles are for people already on the platform, not for search engines.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { memberNumber } = await params
  const m = await getPublicMember(memberNumber)
  return { title: m ? `${m.displayName} · ${m.memberNumber}` : "Member not found", robots: { index: false, follow: false } }
}

export default async function MemberProfilePage({ params }: Props) {
  const { memberNumber, slug } = await params
  const member = await getPublicMember(memberNumber)
  if (!member) notFound()

  // The member number is the identity; the name in the URL is just readable. Any other name (or
  // none) lands on the canonical address, so old links keep working after someone renames.
  const requested = `/u/${memberNumber}/${(slug ?? []).join("/")}`
  if (requested !== member.profilePath) {
    redirect(member.profilePath)
  }

  const s = member.seller
  const since = new Date(member.memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        <NexusCard className="p-8 bg-white/[0.02] border-white/5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight break-words">{member.displayName}</h1>
              <p className="font-mono text-lg text-gray-400 mt-1">{member.memberNumber}</p>
            </div>
            {s && <NexusBadge variant="success"><BadgeCheck className="w-3 h-3 inline mr-1" />Seller</NexusBadge>}
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Member since {since}</p>
        </NexusCard>

        {s ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NexusCard className="p-5 bg-white/[0.02] border-white/5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Star className="w-3.5 h-3.5 text-amber-300" /> Rating</div>
                <div className="text-2xl font-bold">{s.rating.count ? `${s.rating.average?.toFixed(1)} ★` : "No reviews yet"}</div>
                {s.rating.count > 0 && <div className="text-xs text-gray-500 mt-1">{s.rating.count} verified review{s.rating.count === 1 ? "" : "s"}</div>}
              </NexusCard>
              <NexusCard className="p-5 bg-white/[0.02] border-white/5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><PackageCheck className="w-3.5 h-3.5 text-emerald-400" /> Completed sales</div>
                <div className="text-2xl font-bold">{s.completedSales}</div>
              </NexusCard>
              <NexusCard className="p-5 bg-white/[0.02] border-white/5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Boxes className="w-3.5 h-3.5 text-purple-400" /> Live listings</div>
                <div className="text-2xl font-bold">{s.liveListings}</div>
              </NexusCard>
            </div>

            <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-3">
              <h2 className="font-bold flex items-center gap-2"><Store className="w-4 h-4 text-cyan-400" /> {s.storeName}</h2>
              {s.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">{s.categories.map((c) => <NexusBadge key={c} variant="info">{c}</NexusBadge>)}</div>
              ) : <p className="text-sm text-gray-500">No categories unlocked yet.</p>}
            </NexusCard>

            <Link href="/shop" className="inline-block text-[11px] font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300">Browse the shop</Link>
          </>
        ) : (
          <NexusCard className="p-8 bg-white/[0.02] border-white/5 text-sm text-gray-500">This member is a buyer. Buyers' ratings are only visible to sellers they have ordered from.</NexusCard>
        )}
      </div>
    </div>
  )
}
