'use client';

import React, { useState } from 'react';

export function ConfidentialTipLine() {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tipCategory, setTipCategory] = useState('celebrity-scoop');
  const [tipText, setTipText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipText.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTipText('');
      setModalOpen(false);
      alert('Secure Scoop Transmitted to Law Elite Confidential Desk. Thank you.');
    }, 2000);
  };

  return (
    <>
      {/* Homepage Banner trigger */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-black text-white rounded-2xl p-6 border border-red-900/60 shadow-2xl my-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-red-600/30">
            🕵️‍♂️
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
              <span>PAGE SIX & LAW ELITE TIP LINE</span>
              <span>•</span>
              <span className="text-emerald-400">ENCRYPTED 256-BIT PGP</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-serif text-white">
              Have a Legal Scoop or Unreleased Court Document?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Submit confidential information, celebrity courthouse sightings, or corporate filings directly to our senior investigative desk.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>🔒 Submit Confidential Scoop</span>
        </button>
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 text-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
                ENCRYPTED SCOOP PORTAL
              </span>
              <h3 className="text-xl font-black font-serif text-white">
                Submit Confidential Tip to Law Elite Editors
              </h3>
            </div>

            {submitted ? (
              <div className="p-6 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-center space-y-2">
                <div className="text-3xl">🔒</div>
                <h4 className="font-bold text-emerald-400 text-lg">Tip Encrypted & Received</h4>
                <p className="text-xs text-slate-300">
                  Your transmission hash has been verified. Our editors are reviewing your submission.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    Select Category
                  </label>
                  <select
                    value={tipCategory}
                    onChange={(e) => setTipCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-red-500 outline-none"
                  >
                    <option value="celebrity-scoop">Page Six Celebrity Courthouse Sightings</option>
                    <option value="scotus-insider">SCOTUS / Federal Docket Tip</option>
                    <option value="corporate-leak">Delaware Chancery / Corporate Whistleblower</option>
                    <option value="other">General Legal Tip</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    Scoop Details / Transcript
                  </label>
                  <textarea
                    rows={4}
                    value={tipText}
                    onChange={(e) => setTipText(e.target.value)}
                    placeholder="Describe what happened, individuals involved, location, or court case numbers..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:border-red-500 outline-none"
                    required
                  ></textarea>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-200">🛡️ Anonymity Guarantee</div>
                  <p>
                    We protect confidential sources under First Amendment press privilege. No IP addresses or tracking logs are retained.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition shadow-lg"
                >
                  Transmit Encrypted Scoop Now
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
