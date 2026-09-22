"use client";

import React, { useState } from 'react';
import { Mail, CheckCircle, ShieldCheck } from 'lucide-react';

export function NewsletterBanner() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitted(true);
  };

  return (
    <section className="my-10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-y-4 border-[#E13131] text-white p-8 md:p-12 shadow-xl rounded-sm">
      <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#E13131] text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-sm shadow-sm">
            <Mail className="w-3.5 h-3.5" /> LAW ELITE DAILY SCOOP
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-none">
            GET THE EXCLUSIVE SCOOP IN YOUR INBOX
          </h2>
          <p className="text-slate-300 font-serif text-base max-w-xl">
            Join over <strong className="text-white font-bold">250,000+ readers</strong> receiving breaking court decisions, celebrity sightings, and exclusive high-stakes legal reports every morning.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Free Daily Briefing</span>
            <span>·</span>
            <span>No Spam Ever</span>
            <span>·</span>
            <span>Unsubscribe Anytime</span>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 min-w-[320px] max-w-md">
          {submitted ? (
            <div className="bg-emerald-950/80 border-2 border-emerald-500 p-6 rounded-sm text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-white">YOU’RE ON THE LIST!</h3>
              <p className="text-xs text-emerald-200">Check your email inbox for your first Law Elite Daily edition.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full px-4 py-3.5 bg-slate-900 border-2 border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#E13131] rounded-sm"
              />
              <button
                type="submit"
                className="w-full bg-[#E13131] hover:bg-red-700 text-white font-black text-sm uppercase tracking-widest py-3.5 rounded-sm transition-all shadow-md active:scale-[0.99]"
              >
                SUBSCRIBE FREE NOW →
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
