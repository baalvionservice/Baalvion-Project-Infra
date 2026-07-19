"use client"

import { useEffect, useState } from "react"
import { Database, ShieldCheck, User } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { getAllModerationLogs, type ModerationLogEntry } from "@/lib/api/community"

const ACTION_BADGE: Record<string, string> = {
  ban: "bg-red-500/10 text-red-400 border-none",
  unban: "bg-emerald-500/10 text-emerald-400 border-none",
  role_change: "bg-fuchsia-500/10 text-fuchsia-400 border-none",
  remove_content: "bg-red-500/10 text-red-400 border-none",
  dismiss_report: "bg-white/5 text-gray-400 border-none",
};

export default function ModerationLogsPage() {
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllModerationLogs().then((l) => { setLogs(l); setLoading(false); });
  }, []);

  return (
    <div className="p-10 space-y-12 max-w-[1200px] mx-auto">
      <header>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Moderation Logs</h1>
        <p className="text-gray-500 font-medium text-lg">Every moderator action taken across every community, most recent first.</p>
      </header>

      {loading ? (
        <div className="text-gray-500 font-medium">Loading…</div>
      ) : logs.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <ShieldCheck className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No moderation actions recorded yet.</p>
        </NexusCard>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <NexusCard key={log.id} className="p-5 border-white/5 bg-white/[0.01]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <NexusBadge className={ACTION_BADGE[log.action] ?? "bg-white/5 text-gray-400 border-none"}>
                        {log.action.replace(/_/g, " ")}
                      </NexusBadge>
                      {log.community && (
                        <NexusBadge className="bg-cyan-500/10 text-cyan-400 border-none">{log.community.name}</NexusBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <User className="w-3 h-3" />
                      {log.actor_user_id}
                      {log.target_user_id && <span className="text-gray-600">→ {log.target_user_id}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </NexusCard>
          ))}
        </div>
      )}
    </div>
  )
}
