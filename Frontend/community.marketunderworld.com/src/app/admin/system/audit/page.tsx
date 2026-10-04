"use client";

import React, { useState } from 'react';
import { ScrollText, Search, Filter, ShieldAlert, Trash2, Edit2, CheckCircle, XCircle, Eye } from 'lucide-react';

const MOCK_LOGS = [
  { id: "LOG-0091", staff: "admin_wade", role: "Super Admin", action: "Approved KYC for mumbai_dancer99", target: "User: mumbai_dancer99", ip: "192.168.1.1", timestamp: "2026-10-02 15:30:12", severity: "Info" },
  { id: "LOG-0092", staff: "mod_sarah", role: "Moderator", action: "Deleted Thread: 'Free Tools 2026'", target: "Thread #4821", ip: "10.0.0.45", timestamp: "2026-10-02 14:55:03", severity: "Warning" },
  { id: "LOG-0093", staff: "mod_raj", role: "Moderator", action: "Issued 2nd Strike to spammer_x", target: "User: spammer_x", ip: "10.0.0.46", timestamp: "2026-10-02 14:20:44", severity: "Warning" },
  { id: "LOG-0094", staff: "admin_wade", role: "Super Admin", action: "Force-ended Live Session LIVE-8803", target: "Session LIVE-8803", ip: "192.168.1.1", timestamp: "2026-10-02 13:45:00", severity: "Critical" },
  { id: "LOG-0095", staff: "mod_sarah", role: "Moderator", action: "Approved Refund REF-7703 for $899.00", target: "Refund REF-7703", ip: "10.0.0.45", timestamp: "2026-10-02 12:10:33", severity: "Info" },
  { id: "LOG-0096", staff: "admin_wade", role: "Super Admin", action: "Updated Commission: Elite Seller 8% → 7%", target: "Commission Config", ip: "192.168.1.1", timestamp: "2026-10-02 10:00:00", severity: "Info" },
  { id: "LOG-0097", staff: "mod_raj", role: "Moderator", action: "Banned User: toxic_user_404 (3 strikes)", target: "User: toxic_user_404", ip: "10.0.0.46", timestamp: "2026-10-02 09:30:15", severity: "Critical" },
];

function severityClass(severity: string) {
  if (severity === 'Critical') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (severity === 'Warning') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
}

function severityIcon(severity: string) {
  if (severity === 'Critical') return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
  if (severity === 'Warning') return <Eye className="w-3.5 h-3.5 text-amber-400" />;
  return <CheckCircle className="w-3.5 h-3.5 text-blue-400" />;
}

export default function StaffAuditLogs() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_LOGS.filter(log =>
    log.staff.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-fuchsia-500" />
          Staff Audit Logs
        </h1>
        <p className="text-sm text-gray-400 mt-1">A tamper-proof record of every action taken by staff members across the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121217] border border-red-500/20 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Critical Actions (Today)</div>
          <div className="text-3xl font-black text-red-400">{MOCK_LOGS.filter(l => l.severity === 'Critical').length}</div>
        </div>
        <div className="bg-[#121217] border border-amber-500/20 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Warnings (Today)</div>
          <div className="text-3xl font-black text-amber-400">{MOCK_LOGS.filter(l => l.severity === 'Warning').length}</div>
        </div>
        <div className="bg-[#121217] border border-white/5 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Total Logged Actions</div>
          <div className="text-3xl font-black text-white">{MOCK_LOGS.length}</div>
        </div>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by staff member, action, or target..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Staff Member</th>
                <th className="px-6 py-4 font-medium">Action Performed</th>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${severityClass(log.severity)}`}>
                      {severityIcon(log.severity)}
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{log.staff}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{log.role}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 max-w-xs">
                    <p className="truncate">{log.action}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs font-mono">{log.target}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-mono">{log.ip}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{log.timestamp}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No matching audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
