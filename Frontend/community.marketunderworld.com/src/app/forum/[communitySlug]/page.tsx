import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Eye } from "lucide-react";
import { NexusCard } from "@/components/ui/nexus-card";
import { NexusButton } from "@/components/ui/nexus-button";
import { AccessGate } from "@/components/forums/access-gate";
import { getCommunity, getThreads } from "@/lib/api/community";

export default async function CommunityPage({ params }: { params: Promise<{ communitySlug: string }> }) {
  const { communitySlug } = await params;
  const community = await getCommunity(communitySlug);

  if (!community) {
    notFound();
  }

  const canRead = community.accessModel === "free" || ["approved", "paid"].includes(community.membership?.status ?? "");
  const threads = canRead ? await getThreads(communitySlug) : [];

  return (
    <div className="pb-32">
      <section className="relative pt-44 pb-16 overflow-hidden border-b border-white/5">
        <div className="container mx-auto px-6">
          <Link href="/forum" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-cyan-400 transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Communities
          </Link>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">{community.name}</h1>
          <p className="text-xl text-gray-400 font-medium max-w-2xl">{community.description}</p>
        </div>
      </section>

      <main className="container mx-auto px-6 pt-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="flex-1 space-y-12">
            {!canRead && <AccessGate community={community} />}

            {canRead && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{threads.length} Discussions</h2>
                  <Link href={`/forum/${communitySlug}/create-thread`}>
                    <NexusButton className="nexus-gradient-bg font-bold">Start Discussion</NexusButton>
                  </Link>
                </div>

                {threads.length === 0 ? (
                  <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
                    <p className="text-gray-500 font-medium">No discussions yet — be the first to post.</p>
                  </NexusCard>
                ) : (
                  <div className="space-y-4">
                    {threads.map((thread) => (
                      <Link key={thread.tid} href={`/forum/thread/${thread.tid}?c=${communitySlug}`}>
                        <NexusCard className="p-6 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group cursor-pointer">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1 space-y-2">
                              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                                {thread.title}
                              </h3>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <span>{thread.user?.username ?? "member"}</span>
                                <span className="w-1 h-1 bg-white/10 rounded-full" />
                                <span>{new Date(thread.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-8 border-l border-white/5 pl-8">
                              <div className="text-center w-16">
                                <div className="text-xl font-bold">{thread.postcount}</div>
                                <div className="text-[9px] font-bold text-gray-600 uppercase">Replies</div>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600 text-xs">
                                <Eye className="w-4 h-4" /> {thread.viewcount}
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-cyan-400 transition-all group-hover:translate-x-1" />
                            </div>
                          </div>
                        </NexusCard>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
