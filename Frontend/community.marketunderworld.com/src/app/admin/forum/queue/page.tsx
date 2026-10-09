"use client";

import React, { useState, useEffect } from 'react';
import { Scale, Search, Filter, AlertTriangle, CheckCircle, Trash2, ShieldBan, MessageSquare } from 'lucide-react';
import { getFlags, resolveFlag, type FlaggedContent } from "@/lib/api/community";

function statusClass(status: string) {
  if (status === 'open' || status === 'wip') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (status === 'resolved') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'rejected') return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  return 'bg-white/10 text-gray-400';
}

export default function ThreadQueueManager() {
  const [reports, setReports] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFlags().then((flags) => {
      setReports(flags);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const dismissReport = async (flag: FlaggedContent) => {
    try {
      await resolveFlag(flag.flagId, "dismiss", { pid: flag.target.id, communitySlug: flag.community?.slug ?? null });
      setReports(reports.map(r => r.flagId === flag.flagId ? { ...r, state: "rejected" } : r));
    } catch {
      alert("Failed to dismiss report");
    }
  };

  const deleteContent = async (flag: FlaggedContent) => {
    try {
      await resolveFlag(flag.flagId, "remove", { pid: flag.target.id, communitySlug: flag.community?.slug ?? null });
      setReports(reports.map(r => r.flagId === flag.flagId ? { ...r, state: "resolved" } : r));
    } catch {
      alert("Failed to delete content");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-fuchsia-500" />
          Thread Moderation Queue
        </h1>
        <p className="text-sm text-gray-400 mt-1">Review reported posts, spam, and rules violations.</p>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search reports or usernames..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pending reports.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Report Info</th>
                  <th className="px-6 py-4 font-medium">Reported Content</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report) => (
                  <tr key={report.flagId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-500 mb-1">{report.flagId}</div>
                      <div className="text-sm font-bold text-red-400">{report.target.author || "Unknown"}</div>
                      <div className="text-xs text-gray-500 mt-1">Reported by: {report.reporter?.username || "System"}</div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Thread: {report.target.title || "Unknown Thread"}
                        </div>
                        <div className="text-gray-300 italic truncate">&quot;{report.target.content || "No content"}&quot;</div>
                        <div className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {report.reasons?.join(", ") || "No reason specified"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass(report.state)}`}>
                        {report.state}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-2">
                          <button
                            onClick={() => dismissReport(report)}
                            disabled={report.state !== 'open' && report.state !== 'wip'}
                            title="Dismiss Report"
                            className="p-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteContent(report)}
                            disabled={report.state !== 'open' && report.state !== 'wip'}
                            title="Delete Content"
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <a href="/admin/forum/strikes" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                          <ShieldBan className="w-3 h-3" /> Issue Strike
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
