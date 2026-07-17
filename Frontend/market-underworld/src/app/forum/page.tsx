import Link from "next/link";
import { Hash, ArrowRight, KeyRound } from "lucide-react";
import { getCommunities } from "@/lib/api/community";
import { CommunityCard } from "@/components/forums/community-card";

/**
 * @fileOverview Forum hub — real communities from community-service, replacing the mock
 * geographic "region" hubs. Each community is a distinct topical space (cybersecurity,
 * education, investors & founders, trading, general, …) with its own access model.
 *
 * Platform-wide access tiers (marketplace-access/global-elite/vip-access) share the same
 * community-service membership/billing plumbing but are NOT discussion forums — they're
 * filtered out here (isForum: false) and pointed at /access instead, so this hub only ever
 * lists spaces you can actually browse into.
 */

export default async function ForumHubPage() {
  const allCommunities = await getCommunities();
  const communities = allCommunities.filter((c) => c.isForum);

  return (
    <div className="container max-w-[1440px] mx-auto px-6 pt-44 pb-32">
      <header className="mb-20 space-y-8">
        <div className="flex items-center gap-3 text-cyan-400 font-bold text-[12px] uppercase tracking-[0.2em]">
          <Hash className="w-4 h-4" /> COMMUNITY
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-[0.9]">
          Communities.
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl font-medium">
          Real, moderated spaces for people who think differently — security researchers,
          educators, investors and founders, and everyone building in the open.
        </p>
      </header>

      {communities.length === 0 ? (
        <div className="mu-card p-16 text-center border border-white/5 bg-[#111118]">
          <p className="text-gray-500 font-medium">No communities are available right now — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communities.map((community) => (
            <CommunityCard key={community.slug} community={community} />
          ))}
        </div>
      )}

      <Link
        href="/access"
        className="mt-12 flex items-center justify-between gap-6 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/[0.04] p-8 hover:border-fuchsia-500/40 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <p className="text-white font-bold">Looking for Marketplace, Global Elite, or VIP access?</p>
            <p className="text-gray-500 text-sm">Those are platform-wide tiers, not browsable communities — unlock them on the Access page.</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-fuchsia-400 shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
