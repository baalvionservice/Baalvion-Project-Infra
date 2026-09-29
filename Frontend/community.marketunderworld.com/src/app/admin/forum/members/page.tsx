"use client"

import { useEffect, useState } from "react"
import { Users, ShieldCheck, Ban, ChevronDown } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import {
  getCommunities,
  getCommunityMembers,
  setMemberRole,
  setMemberStatus,
  type Community,
  type CommunityMember,
  type CommunityRole,
} from "@/lib/api/community"

const ROLE_BADGE: Record<CommunityRole, string> = {
  member: "bg-white/5 text-gray-400 border-none",
  moderator: "bg-cyan-500/10 text-cyan-400 border-none",
  admin: "bg-fuchsia-500/10 text-fuchsia-400 border-none",
};

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-400 border-none",
  paid: "bg-emerald-500/10 text-emerald-400 border-none",
  requested: "bg-amber-500/10 text-amber-400 border-none",
  invited: "bg-amber-500/10 text-amber-400 border-none",
  banned: "bg-red-500/10 text-red-400 border-none",
  rejected: "bg-red-500/10 text-red-400 border-none",
  cancelled: "bg-white/5 text-gray-500 border-none",
  expired: "bg-white/5 text-gray-500 border-none",
};

export default function ForumMembersPage() {
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    getCommunities().then((all) => {
      const forums = all.filter((c) => c.isForum);
      setCommunities(forums);
      if (forums.length > 0) setSelectedSlug(forums[0].slug);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    setLoading(true);
    getCommunityMembers(selectedSlug).then((m) => { setMembers(m); setLoading(false); });
  }, [selectedSlug]);

  const reload = () => {
    if (selectedSlug) getCommunityMembers(selectedSlug).then(setMembers);
  };

  const handleRoleChange = async (userId: string, role: CommunityRole) => {
    if (!selectedSlug) return;
    setBusyUserId(userId);
    try {
      await setMemberRole(selectedSlug, userId, role);
      toast({ title: `Role updated to ${role}` });
      reload();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't update role", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleBan = async (userId: string) => {
    if (!selectedSlug) return;
    setBusyUserId(userId);
    try {
      await setMemberStatus(selectedSlug, userId, "banned");
      toast({ title: "Member banned" });
      reload();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't ban member", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!selectedSlug) return;
    setBusyUserId(userId);
    try {
      await setMemberStatus(selectedSlug, userId, "approved");
      toast({ title: "Member reinstated" });
      reload();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't reinstate member", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="p-10 space-y-8 max-w-[1200px] mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Members</h1>
        <p className="text-gray-500 font-medium text-lg">Manage roles and access for each community — promote to moderator/admin, or ban.</p>
      </header>

      {communities.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No communities available.</p>
        </NexusCard>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {communities.map((c) => (
              <button
                key={c.slug}
                onClick={() => setSelectedSlug(c.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                  selectedSlug === c.slug
                    ? "bg-cyan-500 border-cyan-500 text-black"
                    : "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-gray-500 font-medium">Loading…</div>
          ) : members.length === 0 ? (
            <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
              <p className="text-gray-500 font-medium">No members in this community yet.</p>
            </NexusCard>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <NexusCard key={m.userId} className="p-5 border-white/5 bg-white/[0.01]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{m.email || m.userId}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <NexusBadge className={ROLE_BADGE[m.role]}>{m.role}</NexusBadge>
                          <NexusBadge className={STATUS_BADGE[m.status] || "bg-white/5 text-gray-500 border-none"}>{m.status}</NexusBadge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <select
                          value={m.role}
                          disabled={busyUserId === m.userId}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as CommunityRole)}
                          className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500/50 cursor-pointer disabled:opacity-40"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {m.status === "banned" ? (
                        <NexusButton
                          size="sm"
                          isLoading={busyUserId === m.userId}
                          onClick={() => handleUnban(m.userId)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-9 gap-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Reinstate
                        </NexusButton>
                      ) : (
                        <NexusButton
                          size="sm"
                          variant="outline"
                          isLoading={busyUserId === m.userId}
                          onClick={() => handleBan(m.userId)}
                          className="border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold text-[10px] h-9 gap-2"
                        >
                          <Ban className="w-3.5 h-3.5" /> Ban
                        </NexusButton>
                      )}
                    </div>
                  </div>
                </NexusCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
