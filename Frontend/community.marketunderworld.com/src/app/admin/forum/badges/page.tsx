"use client";

import React, { useState } from 'react';
import { Award, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const INITIAL_BADGES = [
  { id: 1, name: "VIP Member", color: "#a855f7", icon: "👑", description: "Exclusive high-value members", assignedTo: 12 },
  { id: 2, name: "Trusted Contributor", color: "#22c55e", icon: "✅", description: "Verified community contributors", assignedTo: 47 },
  { id: 3, name: "Elite Seller", color: "#eab308", icon: "⭐", description: "Top-performing marketplace sellers", assignedTo: 8 },
  { id: 4, name: "Staff", color: "#ef4444", icon: "🛡️", description: "Official platform staff members", assignedTo: 5 },
  { id: 5, name: "Beta Tester", color: "#3b82f6", icon: "🔬", description: "Early access program participants", assignedTo: 31 },
];

type Badge = typeof INITIAL_BADGES[0];

export default function RankBadgesManager() {
  const [badges, setBadges] = useState(INITIAL_BADGES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newBadge, setNewBadge] = useState({ name: "", color: "#a855f7", icon: "🏅", description: "" });

  const deleteBadge = (id: number) => {
    setBadges(badges.filter(b => b.id !== id));
  };

  const addBadge = () => {
    if (!newBadge.name.trim()) return;
    setBadges([...badges, { ...newBadge, id: Date.now(), assignedTo: 0 }]);
    setNewBadge({ name: "", color: "#a855f7", icon: "🏅", description: "" });
    setShowNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            Rank & Badges Manager
          </h1>
          <p className="text-sm text-gray-400 mt-1">Create, edit and assign custom badges that appear next to usernames on forum posts.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> New Badge
        </button>
      </div>

      {showNew && (
        <div className="bg-[#121217] border border-fuchsia-500/30 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4">Create New Badge</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Badge Name</label>
              <input
                type="text"
                value={newBadge.name}
                onChange={e => setNewBadge({ ...newBadge, name: e.target.value })}
                placeholder="e.g. Legend"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Icon (Emoji)</label>
              <input
                type="text"
                value={newBadge.icon}
                onChange={e => setNewBadge({ ...newBadge, icon: e.target.value })}
                placeholder="🏅"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newBadge.color}
                  onChange={e => setNewBadge({ ...newBadge, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-sm text-gray-400 font-mono">{newBadge.color}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
              <input
                type="text"
                value={newBadge.description}
                onChange={e => setNewBadge({ ...newBadge, description: e.target.value })}
                placeholder="What this badge represents"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={addBadge} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors">
              <Save className="w-4 h-4" /> Save Badge
            </button>
            <button onClick={() => setShowNew(false)} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-sm transition-colors border border-white/10">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {badges.map(badge => (
          <div key={badge.id} className="bg-[#121217] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: badge.color + '22', border: `1px solid ${badge.color}44` }}
                >
                  {badge.icon}
                </div>
                <div>
                  <div className="font-bold text-white">{badge.name}</div>
                  <div
                    className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    style={{ backgroundColor: badge.color + '22', color: badge.color }}
                  >
                    Active
                  </div>
                </div>
              </div>
              <button onClick={() => deleteBadge(badge.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">{badge.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-xs text-gray-500">{badge.assignedTo} users assigned</span>
              <button className="flex items-center gap-1.5 text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold transition-colors">
                <Edit2 className="w-3 h-3" /> Assign to User
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
