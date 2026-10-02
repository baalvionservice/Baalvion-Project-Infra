"use client";

import React, { useState } from 'react';
import { Video, Radio, Users, XCircle, Eye } from 'lucide-react';

const MOCK_SESSIONS = [
  { id: "LIVE-8801", teacher: "HackMaster_v2", title: "Live: Zero-Day Exploitation Workshop", viewers: 143, duration: "1h 22m", startedAt: "2026-10-02 14:00", status: "Live Now" },
  { id: "LIVE-8802", teacher: "CryptoTrader_Pro", title: "Live: Dark Market AMA Session", viewers: 87, duration: "0h 45m", startedAt: "2026-10-02 14:37", status: "Live Now" },
  { id: "LIVE-8803", teacher: "OSINT_Detective", title: "OSINT Deep Dive — Tracing Identities", viewers: 0, duration: "2h 10m", startedAt: "2026-10-02 12:00", status: "Ended" },
];

function statusDot(status: string) {
  if (status === 'Live Now') return 'bg-red-500';
  return 'bg-gray-600';
}

function statusClass(status: string) {
  if (status === 'Live Now') return 'bg-red-500/10 text-red-400 border border-red-500/30';
  return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
}

export default function LiveSessionMonitor() {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const endSession = (id: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, status: "Force Ended", viewers: 0 } : s));
  };

  const liveSessions = sessions.filter(s => s.status === 'Live Now');
  const totalViewers = liveSessions.reduce((sum, s) => sum + s.viewers, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Video className="w-6 h-6 text-red-500" />
          Live Session Monitor
        </h1>
        <p className="text-sm text-gray-400 mt-1">Monitor active live streams and force-end sessions that violate platform rules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121217] border border-red-500/20 p-5 rounded-xl flex items-center gap-4">
          <div className="relative">
            <Radio className="w-8 h-8 text-red-500" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </div>
          <div>
            <div className="text-sm text-gray-400 font-bold">Active Sessions</div>
            <div className="text-3xl font-black text-red-400">{liveSessions.length}</div>
          </div>
        </div>
        <div className="bg-[#121217] border border-white/5 p-5 rounded-xl flex items-center gap-4">
          <Users className="w-8 h-8 text-fuchsia-500" />
          <div>
            <div className="text-sm text-gray-400 font-bold">Total Live Viewers</div>
            <div className="text-3xl font-black text-white">{totalViewers}</div>
          </div>
        </div>
        <div className="bg-[#121217] border border-white/5 p-5 rounded-xl flex items-center gap-4">
          <Video className="w-8 h-8 text-gray-600" />
          <div>
            <div className="text-sm text-gray-400 font-bold">Ended Today</div>
            <div className="text-3xl font-black text-gray-400">{sessions.filter(s => s.status === 'Ended').length}</div>
          </div>
        </div>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <h2 className="font-bold text-white">All Sessions Today</h2>
        </div>

        <div className="divide-y divide-white/5">
          {sessions.map(session => (
            <div key={session.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6 text-gray-400" />
                  {session.status === 'Live Now' && (
                    <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${statusDot(session.status)}`}>
                      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-white">{session.title}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{session.teacher}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusClass(session.status)}`}>
                      {session.status}
                    </span>
                    <span className="text-xs text-gray-500">Started {session.startedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Viewers</div>
                  <div className="text-xl font-black text-white flex items-center gap-1">
                    <Eye className="w-4 h-4 text-fuchsia-400" />
                    {session.viewers}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Duration</div>
                  <div className="text-xl font-black text-white">{session.duration}</div>
                </div>

                <button
                  onClick={() => endSession(session.id)}
                  disabled={session.status !== 'Live Now'}
                  className="flex items-center gap-2 h-10 px-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" /> Force End
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
