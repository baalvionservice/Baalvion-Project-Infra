"use client";

import React, { useState } from 'react';
import { Mail, Check } from 'lucide-react';

export function ArticleNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Something went wrong.');
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className="my-10 p-6 md:p-8 bg-slate-900 text-white border-t-4 border-[#E13131]">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#E13131] text-white rounded-none mb-1">
          <Mail className="w-6 h-6" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-sans">
          GET LAW ELITE IN YOUR INBOX
        </h2>
        
        <p className="text-slate-300 text-sm md:text-base font-serif">
          Breakthrough legal analysis, career insights, and law school strategies delivered straight to your email.
        </p>

        {subscribed ? (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-4 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm">
            <Check className="w-5 h-5" />
            Thank you for subscribing to Law Elite Network!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 bg-white text-slate-900 font-sans text-sm focus:outline-none border-2 border-transparent focus:border-[#E13131]"
            />
            <button
              type="submit"
              className="bg-[#E13131] hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs px-6 py-3 transition-colors"
            >
              SUBSCRIBE
            </button>
          </form>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        
        <p className="text-[11px] text-slate-400">
          By subscribing, you agree to our Terms of Service and Privacy Policy. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
