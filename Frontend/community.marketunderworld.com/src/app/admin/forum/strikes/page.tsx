"use client";

import React, { useEffect, useState } from "react";
import { AlertOctagon, Search, ShieldBan, UserX, AlertTriangle, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getCommunities,
  getCommunityMembers,
  setMemberStatus,
  revokeMember,
  type Community,
  type CommunityMember,
} from "@/lib/api/community";

function statusColor(status: string) {
  if (status === "banned")   return "bg-red-500/20 text-red-400";
  if (status === "approved") return "bg-emerald-500/20 text-emerald-400";
  return "bg-yellow-500/20 text-yellow-400";
}

export default function WarnAndStrikeManager() {
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Ban a specific user
  const [targetUserId, setTargetUserId] = useState("");
  const [reason, setReason] = useState("");
  const [banning, setBanning] = useState(false);

  // Load communities on mount
  useEffect(() => {
    getCommunities().then((all) => {
      const forums = all.filter((c) => c.isForum);
      setCommunities(forums);
      if (forums[0]) setSelectedSlug(forums[0].slug);
    });
  }, []);

  // Load members when community changes
  useEffect(() => {
    if (!selectedSlug) return;
    setLoading(true);
    getCommunityMembers(selectedSlug).then((m) => {
      setMembers(m);
      setLoading(false);
    });
  }, [selectedSlug]);

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !selectedSlug) return;
    setBanning(true);
    try {
      await setMemberStatus(selectedSlug, targetUserId.trim(), "banned");
      toast({ title: "Member banned", description: `User ${targetUserId} has been banned from ${selectedSlug}.` });
      setTargetUserId("");
      setReason("");
      // Refresh
      const m = await getCommunityMembers(selectedSlug);
      setMembers(m);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't ban member", description: err?.message });
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!selectedSlug) return;
    setActionBusy(userId);
    try {
      await setMemberStatus(selectedSlug, userId, "approved");
      toast({ title: "Member unbanned" });
      const m = await getCommunityMembers(selectedSlug);
      setMembers(m);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't unban", description: err?.message });
    } finally {
      setActionBusy(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!selectedSlug) return;
    setActionBusy(userId);
    try {
      await revokeMember(selectedSlug, userId);
      toast({ title: "Member removed" });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Couldn't remove", description: err?.message });
    } finally {
      setActionBusy(null);
    }
  };

  const bannedMembers = members.filter((m) => m.status === "banned");
  const searchFilter = search.toLowerCase();
  const visible = bannedMembers.filter((m) =>
    !searchFilter || (m.email ?? "").toLowerCase().includes(searchFilter) || m.userId.includes(searchFilter)
  );

  return (
    <div className="space-y-6 p-8 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-red-500" />
          Ban &amp; Strike Manager
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Ban members from specific communities. All actions are written to the backend immediately.
        </p>
      </div>

      {/* Community picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Community:</span>
        {communities.map((c) => (
          <button
            key={c.slug}
            onClick={() => setSelectedSlug(c.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              selectedSlug === c.slug
                ? "bg-red-600/30 border-red-600/60 text-red-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {c.name}
          </button>
        ))}
        <button
          onClick={() => { setLoading(true); getCommunityMembers(selectedSlug).then((m) => { setMembers(m); setLoading(false); }); }}
          className="ml-auto text-gray-500 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ban form */}
        <div className="bg-[#121217] border border-red-500/20 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-bold text-red-400 flex items-center gap-2">
            <ShieldBan className="w-5 h-5" /> Ban a Member
          </h2>
          <form onSubmit={handleBan} className="space-y-4 flex flex-col flex-1">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                User ID
              </label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Paste user ID from Members page"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                required
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Find user IDs in <a href="/admin/forum/members" className="text-red-400 hover:underline">Forum Members</a>.
              </p>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Reason (internal note)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detail the rule violation..."
                className="w-full h-28 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={banning || !targetUserId.trim()}
              className="w-full flex items-center justify-center gap-2 h-12 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
            >
              {banning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {banning ? "Banning…" : "Ban Member"}
            </button>
          </form>
        </div>

        {/* Banned members list */}
        <div className="lg:col-span-2 bg-[#121217] border border-white/5 rounded-xl overflow-hidden flex flex-col" style={{ minHeight: "420px" }}>
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search banned members by email or ID…"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Banned Members ({visible.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No banned members in this community.</p>
              </div>
            ) : (
              visible.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-sm ${statusColor(member.status)}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{member.email ?? member.userId}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID: {member.userId} · Role: {member.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                      Banned
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUnban(member.userId)}
                        disabled={actionBusy === member.userId}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold disabled:opacity-40 transition-colors"
                      >
                        {actionBusy === member.userId ? "…" : "Unban"}
                      </button>
                      <button
                        onClick={() => handleRevoke(member.userId)}
                        disabled={actionBusy === member.userId}
                        className="text-xs text-red-400 hover:text-red-300 font-bold disabled:opacity-40 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
