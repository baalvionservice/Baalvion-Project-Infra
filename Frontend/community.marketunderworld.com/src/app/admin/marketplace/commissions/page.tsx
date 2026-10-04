"use client";

import React, { useState } from 'react';
import { Percent, Save, Info } from 'lucide-react';

const INITIAL_TIERS = [
  { id: 1, name: "New Seller", minSales: 0, maxSales: 9, commission: 15, color: "#6b7280", perks: "Basic listing, email support" },
  { id: 2, name: "Rising Seller", minSales: 10, maxSales: 49, commission: 12, color: "#3b82f6", perks: "Priority listing, chat support" },
  { id: 3, name: "Pro Seller", minSales: 50, maxSales: 199, commission: 10, color: "#a855f7", perks: "Featured listing, dedicated support" },
  { id: 4, name: "Elite Seller", minSales: 200, maxSales: 999, commission: 7, color: "#eab308", perks: "Homepage feature, account manager" },
  { id: 5, name: "Legend Seller", minSales: 1000, maxSales: 999999, commission: 5, color: "#22c55e", perks: "Zero-fee months, VIP badge, direct line" },
];

export default function CommissionTiers() {
  const [tiers, setTiers] = useState(INITIAL_TIERS);
  const [saved, setSaved] = useState(false);

  const updateCommission = (id: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 100) return;
    setTiers(tiers.map(t => t.id === id ? { ...t, commission: num } : t));
    setSaved(false);
  };

  const saveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-green-400" />
            Commission Tiers
          </h1>
          <p className="text-sm text-gray-400 mt-1">Set platform commission rates based on seller performance tiers.</p>
        </div>
        <button
          onClick={saveAll}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors text-sm"
        >
          <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="bg-[#121217] border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-300">
          Commission is the percentage your platform takes from each completed sale. Lower rates incentivize high-performing sellers to stay on your platform.
          Changes apply to all <strong className="text-white">new transactions</strong> only — existing pending orders use the old rate.
        </p>
      </div>

      <div className="space-y-4">
        {tiers.map(tier => (
          <div key={tier.id} className="bg-[#121217] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                  style={{ backgroundColor: tier.color + '22', border: `2px solid ${tier.color}55`, color: tier.color }}
                >
                  {tier.id}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{tier.name}</div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    {tier.maxSales === 999999 ? `${tier.minSales}+ sales` : `${tier.minSales} – ${tier.maxSales} sales`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{tier.perks}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Platform Commission</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={tier.commission}
                      onChange={e => updateCommission(tier.id, e.target.value)}
                      min={0}
                      max={100}
                      step={0.5}
                      className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-2xl font-black text-center text-white focus:outline-none focus:border-green-500/50"
                    />
                    <span className="text-3xl font-black text-gray-300">%</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Seller Keeps</div>
                  <div
                    className="text-3xl font-black"
                    style={{ color: tier.color }}
                  >
                    {(100 - tier.commission).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
