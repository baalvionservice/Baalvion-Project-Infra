"use client"

import { useEffect, useState } from "react"
import { Users, CheckCircle2, XCircle, Inbox } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { getAllPendingJoinRequests, decideJoinRequest, type PendingJoinRequest } from "@/lib/api/community"

export default function ForumModeratorDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PendingJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAllPendingJoinRequests().then((r) => { setRequests(r); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDecide = async (id: string, approve: boolean) => {
    setDecidingId(id);
    try {
      await decideJoinRequest(id, approve);
      toast({ title: approve ? "Request approved" : "Request rejected" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't decide request", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="p-10 space-y-12 max-w-[1200px] mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Join Requests</h1>
        <p className="text-gray-500 font-medium text-lg">Pending requests to join request-to-approve communities, across every community.</p>
      </header>

      {loading ? (
        <div className="text-gray-500 font-medium">Loading…</div>
      ) : requests.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <Inbox className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No pending requests right now.</p>
        </NexusCard>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <NexusCard key={request.id} className="p-6 border-white/5 bg-white/[0.01]">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <NexusBadge className="bg-cyan-500/10 text-cyan-400 border-none">{request.community.name}</NexusBadge>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Users className="w-3 h-3" /> {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {request.message && (
                    <p className="text-gray-300 text-sm leading-relaxed italic">&ldquo;{request.message}&rdquo;</p>
                  )}
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    User: {request.user_id}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
                  <NexusButton
                    size="sm"
                    isLoading={decidingId === request.id}
                    onClick={() => handleDecide(request.id, true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-9 gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </NexusButton>
                  <NexusButton
                    size="sm"
                    variant="outline"
                    isLoading={decidingId === request.id}
                    onClick={() => handleDecide(request.id, false)}
                    className="border-white/10 text-gray-500 font-bold text-[10px] h-9 gap-2"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
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
