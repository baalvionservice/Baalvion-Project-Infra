"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Clock, ShieldCheck, CheckCircle2, Ban } from "lucide-react";
import { NexusButton } from "@/components/ui/nexus-button";
import { NexusCard } from "@/components/ui/nexus-card";
import { useToast } from "@/hooks/use-toast";
import { joinCommunity, type CommunityDetail } from "@/lib/api/community";
import { CryptoCheckout } from "@/components/forums/crypto-checkout";

/**
 * Renders the right call-to-action for a community based on its access model and the
 * caller's own membership status — join / request-pending / invite-required / banned /
 * paid-checkout(coming soon) / already-a-member (renders nothing, content shows through).
 */
export function AccessGate({ community, onJoined }: { community: CommunityDetail; onJoined?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const status = community.membership?.status;

  if (status === "approved" || status === "paid") return null;

  if (status === "banned") {
    return (
      <NexusCard className="p-10 border-red-500/20 bg-red-500/5 text-center">
        <Ban className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-400 font-bold">You no longer have access to this community.</p>
      </NexusCard>
    );
  }

  if (status === "requested") {
    return (
      <NexusCard className="p-10 border-amber-500/20 bg-amber-500/5 text-center">
        <Clock className="w-8 h-8 text-amber-400 mx-auto mb-4" />
        <p className="text-amber-300 font-bold">Your request to join is pending review by a moderator.</p>
      </NexusCard>
    );
  }

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      await joinCommunity(community.slug, message || undefined);
      toast({
        title: community.accessModel === "free" ? "You're in" : "Request sent",
        description: community.accessModel === "free"
          ? "You now have access to this community."
          : "A moderator will review your request shortly.",
      });
      onJoined?.();
      router.refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't join", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (community.accessModel === "invite_only") {
    return (
      <NexusCard className="p-10 border-cyan-500/20 bg-cyan-500/5 text-center">
        <Lock className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
        <p className="text-cyan-200 font-bold mb-2">This community is invite-only.</p>
        <p className="text-gray-500 text-sm">Ask a member for an invite link to join.</p>
      </NexusCard>
    );
  }

  if (community.accessModel === "paid") {
    return (
      <NexusCard className="p-10 border-fuchsia-500/20 bg-fuchsia-500/5">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-6 h-6 text-fuchsia-400" />
          <p className="text-lg font-bold text-white">Paid membership</p>
        </div>
        <CryptoCheckout slug={community.slug} onPaid={onJoined} />
      </NexusCard>
    );
  }

  return (
    <NexusCard className="p-10 border-white/5 bg-white/[0.02] space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        <p className="text-lg font-bold text-white">
          {community.accessModel === "free" ? "Join this community" : "Request to join"}
        </p>
      </div>
      {community.accessModel === "request_approval" && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the moderators a bit about why you'd like to join (optional)"
          className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500/50 transition-all resize-none"
        />
      )}
      <NexusButton onClick={handleJoin} isLoading={submitting} className="w-full nexus-gradient-bg font-bold h-14">
        {community.accessModel === "free" ? "Join Now" : "Send Request"}
      </NexusButton>
    </NexusCard>
  );
}
