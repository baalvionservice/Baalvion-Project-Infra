"use client";

import React, { useState } from 'react';
import { AlertOctagon, Search, ShieldBan, UserX, AlertTriangle, ArrowRight } from 'lucide-react';

const INITIAL_USERS = [
  { username: "spammer_x", strikes: 2, lastViolation: "Spamming", status: "Warned" },
  { username: "toxic_user_404", strikes: 3, lastViolation: "Harassment", status: "Temp Banned (7 Days)" },
];

function strikeColor(strikes: number) {
  if (strikes === 0) return 'bg-green-500/20 text-green-400';
  if (strikes === 1) return 'bg-yellow-500/20 text-yellow-400';
  if (strikes === 2) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-500';
}

export default function WarnAndStrikeManager() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [targetUser, setTargetUser] = useState("");
  const [reason, setReason] = useState("");

  const issueStrike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser.trim() || !reason.trim()) return;

    setUsers(prev => {
      const existing = prev.find(u => u.username === targetUser);
      if (existing) {
        return prev.map(u => {
          if (u.username !== targetUser) return u;
          const newStrikes = u.strikes + 1;
          return { ...u, strikes: newStrikes, lastViolation: reason, status: newStrikes >= 3 ? "Banned" : "Warned" };
        });
      }
      return [...prev, { username: targetUser, strikes: 1, lastViolation: reason, status: "Warned" }];
    });

    setTargetUser("");
    setReason("");
  };

  const pardonUser = (username: string) => {
    setUsers(users.map(u => u.username === username ? { ...u, strikes: 0, status: "Clean" } : u));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-red-500" />
          Warn & Strike System
        </h1>
        <p className="text-sm text-gray-400 mt-1">Issue official warnings, strikes, and automated bans to rule breakers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Issue a strike */}
        <div className="bg-[#121217] border border-red-500/20 rounded-xl p-6 flex flex-col" style={{ height: '500px' }}>
          <h2 className="font-bold text-red-400 flex items-center gap-2 mb-6">
            <ShieldBan className="w-5 h-5" />
            Issue New Strike
          </h2>

          <form onSubmit={issueStrike} className="space-y-4 flex flex-col flex-1">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Username</label>
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                placeholder="e.g. hacker99"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                required
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for Strike</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detail the rule violation..."
                className="w-full h-36 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 h-12 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
            >
              Issue Strike <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right: Offender board */}
        <div className="lg:col-span-2 bg-[#121217] border border-white/5 rounded-xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search active offenders..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Active Offender Registry</h3>

            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active offenders found.</p>
              </div>
            ) : (
              users.map((user, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl ${strikeColor(user.strikes)}`}>
                      {user.strikes}
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">{user.username}</div>
                      <div className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-red-400" /> {user.lastViolation}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${user.status.includes('Banned') ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                      {user.status}
                    </span>
                    <button
                      onClick={() => pardonUser(user.username)}
                      disabled={user.strikes === 0}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Pardon & Clear Record
                    </button>
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
