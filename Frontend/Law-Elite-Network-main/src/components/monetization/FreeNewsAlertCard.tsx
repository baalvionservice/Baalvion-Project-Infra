'use client';

import React, { useState } from 'react';

export function FreeNewsAlertCard() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <div className="my-8 rounded-2xl overflow-hidden border border-red-900/60 bg-gradient-to-r from-slate-950 via-slate-900 to-black text-white p-8 shadow-2xl">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold tracking-widest uppercase">
          ⚡ 100% FREE DAILY SCOOP & BREAKING ALERTS
        </span>

        <h3 className="text-2xl sm:text-3xl font-black font-serif text-white leading-tight">
          Never Miss a Page Six Scoop or SCOTUS Ruling
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
          Get direct email digests covering high-profile trials, celebrity legal battles, and Supreme Court dockets. Free forever. No paywalls.
        </p>

        {subscribed ? (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-400 font-bold text-sm max-w-md mx-auto animate-fadeIn">
            ✓ You are subscribed to Law Elite Daily Scoop! Check your inbox for morning digests.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className="w-full sm:flex-1 px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-xl focus:border-red-500 outline-none"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shrink-0"
            >
              Get Free Alerts
            </button>
          </form>
        )}

        <div className="text-[11px] text-slate-400 font-mono pt-2">
          <span>🔒 Zero spam. Unsubscribe at any time with one click.</span>
        </div>
      </div>
    </div>
  );
}
