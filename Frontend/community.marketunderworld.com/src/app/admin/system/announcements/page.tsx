"use client";

import React, { useState } from 'react';
import { Radio, Send, Globe, Bell, AlertTriangle, CheckCircle } from 'lucide-react';

const ANNOUNCEMENT_TYPES = ["General", "Maintenance", "New Feature", "Urgent Alert", "Promotion"];
const TARGETS = ["All Users", "Forum Members Only", "Marketplace Sellers", "Locals Hub Users", "Education Students"];

const PAST_ANNOUNCEMENTS = [
  { id: 1, title: "🔧 Scheduled Maintenance — Oct 5th 2AM UTC", type: "Maintenance", target: "All Users", sentAt: "2026-10-01 18:00", reach: 12400 },
  { id: 2, title: "🎉 Locals Hub is Live — Mumbai Edition!", type: "New Feature", target: "All Users", sentAt: "2026-09-28 12:00", reach: 12100 },
  { id: 3, title: "⚠️ Crypto Withdrawal Limit Increased to $10,000", type: "General", target: "Marketplace Sellers", sentAt: "2026-09-25 09:00", reach: 342 },
];

function typeIcon(type: string) {
  if (type === 'Maintenance') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  if (type === 'Urgent Alert') return <AlertTriangle className="w-4 h-4 text-red-400" />;
  if (type === 'New Feature') return <CheckCircle className="w-4 h-4 text-green-400" />;
  return <Bell className="w-4 h-4 text-blue-400" />;
}

export default function GlobalAnnouncements() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("General");
  const [target, setTarget] = useState("All Users");
  const [sent, setSent] = useState(false);

  const sendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSent(true);
    setTitle("");
    setBody("");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-fuchsia-500" />
          Global Announcements
        </h1>
        <p className="text-sm text-gray-400 mt-1">Broadcast urgent messages, feature launches, or alerts to all platform users instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Form */}
        <div className="bg-[#121217] border border-fuchsia-500/20 rounded-xl p-6">
          <h2 className="font-bold text-white flex items-center gap-2 mb-6">
            <Send className="w-5 h-5 text-fuchsia-500" />
            Compose Announcement
          </h2>

          {sent && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-sm font-bold">
              <CheckCircle className="w-5 h-5" /> Announcement sent successfully to {target}!
            </div>
          )}

          <form onSubmit={sendAnnouncement} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
                >
                  {ANNOUNCEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Send To</label>
                <select
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
                >
                  {TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Announcement Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 🚨 Urgent: Platform Maintenance Tonight"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write the full announcement message here..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 resize-none"
                required
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">This will push a banner notification to <strong>{target}</strong>. This action cannot be undone.</p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 h-12 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl transition-colors"
            >
              <Globe className="w-5 h-5" /> Broadcast Now
            </button>
          </form>
        </div>

        {/* Past Announcements */}
        <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="font-bold text-white">Previous Announcements</h2>
          </div>
          <div className="flex-1 divide-y divide-white/5">
            {PAST_ANNOUNCEMENTS.map(ann => (
              <div key={ann.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  {typeIcon(ann.type)}
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{ann.title}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="px-1.5 py-0.5 bg-white/10 rounded font-bold text-gray-400">{ann.type}</span>
                      <span>{ann.target}</span>
                      <span>{ann.sentAt}</span>
                    </div>
                    <div className="mt-2 text-xs text-fuchsia-400 font-bold">{ann.reach.toLocaleString()} users reached</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
