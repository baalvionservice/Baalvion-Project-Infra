"use client";

import React, { useState } from 'react';
import { Undo2, Search, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';

const MOCK_REFUNDS = [
  { id: "REF-7701", buyer: "angry_buyer99", seller: "CardingEmpire", item: "Fullz 2026 Batch", amount: "$120.00", reason: "Item not as described — incomplete data", status: "Pending", date: "2026-10-02" },
  { id: "REF-7702", buyer: "crypto_king", seller: "ZeroDayVendor", item: "Custom Script", amount: "$299.00", reason: "Seller went offline, no delivery", status: "Pending", date: "2026-10-01" },
  { id: "REF-7703", buyer: "new_user_84", seller: "PremiumScripts", item: "Trading Bot", amount: "$899.00", reason: "Script crashed on first use", status: "Approved", date: "2026-09-30" },
  { id: "REF-7704", buyer: "anon_user", seller: "TrustSeller", item: "Premium Tools Pack", amount: "$49.00", reason: "Duplicate charge on checkout", status: "Denied", date: "2026-09-29" },
];

function statusClass(status: string) {
  if (status === 'Pending') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (status === 'Approved') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'Denied') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-white/10 text-gray-400';
}

export default function RefundReversals() {
  const [refunds, setRefunds] = useState(MOCK_REFUNDS);

  const approve = (id: string) => setRefunds(refunds.map(r => r.id === id ? { ...r, status: "Approved" } : r));
  const deny = (id: string) => setRefunds(refunds.map(r => r.id === id ? { ...r, status: "Denied" } : r));

  const pending = refunds.filter(r => r.status === 'Pending').length;
  const totalPending = refunds.filter(r => r.status === 'Pending').reduce((sum, r) => sum + parseFloat(r.amount.replace('$', '').replace(',', '')), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Undo2 className="w-6 h-6 text-amber-400" />
          Refund Reversals
        </h1>
        <p className="text-sm text-gray-400 mt-1">Review and approve or deny buyer refund requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121217] border border-amber-500/20 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Pending Decisions</div>
          <div className="text-3xl font-black text-amber-400">{pending}</div>
        </div>
        <div className="bg-[#121217] border border-amber-500/20 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Total $ Pending</div>
          <div className="text-3xl font-black text-amber-400">${totalPending.toLocaleString()}</div>
        </div>
        <div className="bg-[#121217] border border-white/5 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Refunds Approved (All Time)</div>
          <div className="text-3xl font-black text-green-400">$4,210</div>
        </div>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search refund ID, buyer, or seller..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Refund ID</th>
                <th className="px-6 py-4 font-medium">Transaction</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {refunds.map(refund => (
                <tr key={refund.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{refund.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-medium text-xs">{refund.buyer}</span>
                      <ArrowRightLeft className="w-3 h-3 text-gray-600" />
                      <span className="text-fuchsia-400 font-medium text-xs">{refund.seller}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{refund.item}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-amber-400">{refund.amount}</td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-xs text-gray-300 leading-relaxed">{refund.reason}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass(refund.status)}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => approve(refund.id)}
                        disabled={refund.status !== 'Pending'}
                        title="Approve Refund"
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deny(refund.id)}
                        disabled={refund.status !== 'Pending'}
                        title="Deny Refund"
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
