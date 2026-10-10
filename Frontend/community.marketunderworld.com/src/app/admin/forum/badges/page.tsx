"use client";

import React from 'react';
import { Award, Lock } from 'lucide-react';

export default function RankBadgesManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-fuchsia-500" />
          Ranks & Badges
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage platform-wide user ranks, visual badges, and permissions.</p>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-xl">
        <Lock className="w-12 h-12 text-fuchsia-500/50 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
        <p className="text-sm text-gray-400 max-w-md">
          The Badge Management API is currently in development. You will soon be able to sync NodeBB groups, assign custom badge colors, and manage permissions from this dashboard.
        </p>
      </div>
    </div>
  );
}
