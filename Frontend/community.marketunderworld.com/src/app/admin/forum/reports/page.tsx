"use client"

import { useEffect, useState } from "react"
import { Flag, Trash2, ShieldCheck, ShieldAlert } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { getFlags, resolveFlag, type FlaggedContent } from "@/lib/api/community"

export default function ReportsQueuePage() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getFlags().then((f) => { setFlags(f.filter((x) => x.state === "open" || x.state === "wip")); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (flag: FlaggedContent, action: "dismiss" | "remove") => {
    setBusyId(flag.flagId);
    try {
      await resolveFlag(flag.flagId, action, { pid: flag.target.id, communitySlug: flag.community?.slug ?? null });
      toast({ title: action === "remove" ? "Content removed" : "Report dismissed" });
      setFlags((prev) => prev.filter((f) => f.flagId !== flag.flagId));
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't resolve report", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-10 space-y-12 max-w-[1200px] mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Reports Queue</h1>
        <p className="text-gray-500 font-medium text-lg">Flagged posts and comments awaiting review, across every community.</p>
      </header>

      {loading ? (
        <div className="text-gray-500 font-medium">Loading…</div>
      ) : flags.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <ShieldCheck className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No open reports right now.</p>
        </NexusCard>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => (
            <NexusCard key={flag.flagId} className="p-6 border-white/5 bg-white/[0.01]">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {flag.community && <NexusBadge className="bg-cyan-500/10 text-cyan-400 border-none">{flag.community.name}</NexusBadge>}
                    <NexusBadge className="bg-red-500/10 text-red-400 border-none flex items-center gap-1">
                      <Flag className="w-3 h-3" /> {flag.type}
                    </NexusBadge>
                    {flag.createdAt && (
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        {new Date(flag.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {flag.target.title && (
                    <p className="text-sm font-bold text-white truncate">{flag.target.title}</p>
                  )}
                  {flag.target.content && (
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{flag.target.content}</p>
                  )}
                  {flag.reasons.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                      <ShieldAlert className="w-3.5 h-3.5" /> {flag.reasons.join(", ")}
                    </div>
                  )}
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    {flag.target.author && <>Author: {flag.target.author} · </>}
                    {flag.reporter?.username && <>Reported by: {flag.reporter.username}</>}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
                  <NexusButton
                    size="sm"
                    variant="outline"
                    isLoading={busyId === flag.flagId}
                    onClick={() => handleResolve(flag, "dismiss")}
                    className="border-white/10 text-gray-500 font-bold text-[10px] h-9 gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Dismiss
                  </NexusButton>
                  <NexusButton
                    size="sm"
                    isLoading={busyId === flag.flagId}
                    onClick={() => handleResolve(flag, "remove")}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] h-9 gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Content
                  </NexusButton>
                </div>
              </div>
            </NexusCard>
          ))}
        </div>
      )}
    </div>
  )
}
