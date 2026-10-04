"use client";

import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';

const MOCK_ESCROW = [
  { id: "ESC-8842", buyer: "hacker99", seller: "ZeroDayVendor", item: "Custom Malware FUD", amount: "$450.00", status: "Awaiting Release", date: "2026-10-01" },
  { id: "ESC-8843", buyer: "anon_user", seller: "CardingEmpire", item: "Fullz 2026 Batch", amount: "$120.00", status: "Disputed", date: "2026-10-02" },
  { id: "ESC-8844", buyer: "crypto_king", seller: "PremiumScripts", item: "Trading Bot Script", amount: "$899.00", status: "In Escrow", date: "2026-10-02" },
];

function statusClass(status: string) {
  if (status === 'Disputed') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (status === 'In Escrow') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (status === 'Awaiting Release') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (status === 'Released') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'Refunded') return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  return 'bg-white/10 text-gray-400';
}

export default function EscrowManager() {
  const [escrows, setEscrows] = useState(MOCK_ESCROW);

  const releaseFunds = (id: string) => {
    setEscrows(escrows.map(e => e.id === id ? { ...e, status: "Released" } : e));
  };

  const refundBuyer = (id: string) => {
    setEscrows(escrows.map(e => e.id === id ? { ...e, status: "Refunded" } : e));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-fuchsia-500" />
          Escrow Manager
        </h1>
        <p className="text-sm text-gray-400 mt-1">Resolve disputes and release funds held in escrow.</p>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Escrow ID, Buyer, or Seller..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Escrow ID</th>
                <th className="px-6 py-4 font-medium">Transaction</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {escrows.map((escrow) => (
                <tr key={escrow.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-300">{escrow.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-medium">{escrow.buyer}</span>
                      <ArrowRightLeft className="w-3 h-3 text-gray-500" />
                      <span className="text-fuchsia-400 font-medium">{escrow.seller}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{escrow.item}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-400">{escrow.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass(escrow.status)}`}>
                      {escrow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{escrow.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => releaseFunds(escrow.id)}
                        disabled={escrow.status === 'Released' || escrow.status === 'Refunded'}
                        title="Force Release to Seller"
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => refundBuyer(escrow.id)}
                        disabled={escrow.status === 'Released' || escrow.status === 'Refunded'}
                        title="Force Refund to Buyer"
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
