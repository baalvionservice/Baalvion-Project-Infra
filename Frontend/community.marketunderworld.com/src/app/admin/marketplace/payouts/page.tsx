"use client";

import React, { useState } from 'react';
import { Bitcoin, Search, Filter, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';

const MOCK_PAYOUTS = [
  { id: "PAY-9011", seller: "ZeroDayVendor", amount: "0.12 BTC", usdValue: "$8,400.00", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", network: "Bitcoin", status: "Pending", date: "2026-10-02" },
  { id: "PAY-9012", seller: "PremiumScripts", amount: "1,250 USDT", usdValue: "$1,250.00", address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", network: "TRC20", status: "Reviewing", date: "2026-10-02" },
  { id: "PAY-9013", seller: "CardingEmpire", amount: "5.5 ETH", usdValue: "$14,850.00", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", network: "Ethereum", status: "Pending", date: "2026-10-01" },
];

function statusClass(status: string) {
  if (status === 'Pending') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  if (status === 'Reviewing') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (status === 'Approved & Sent') return 'bg-green-500/10 text-green-400 border border-green-500/20';
  if (status === 'Rejected') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-white/10 text-gray-400';
}

export default function PayoutsManager() {
  const [payouts, setPayouts] = useState(MOCK_PAYOUTS);

  const approvePayout = (id: string) => {
    setPayouts(payouts.map(p => p.id === id ? { ...p, status: "Approved & Sent" } : p));
  };

  const rejectPayout = (id: string) => {
    setPayouts(payouts.map(p => p.id === id ? { ...p, status: "Rejected" } : p));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bitcoin className="w-6 h-6 text-yellow-500" />
          Crypto Payouts
        </h1>
        <p className="text-sm text-gray-400 mt-1">Review and process seller withdrawal requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121217] border border-yellow-500/20 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Awaiting Processing</div>
          <div className="text-2xl font-black text-yellow-400">$24,500.00</div>
          <div className="text-xs text-yellow-500/60 mt-1">3 Pending Requests</div>
        </div>
        <div className="bg-[#121217] border border-green-500/20 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Processed Today</div>
          <div className="text-2xl font-black text-green-400">$18,250.00</div>
          <div className="text-xs text-green-500/60 mt-1">12 Successful Transfers</div>
        </div>
        <div className="bg-[#121217] border border-white/5 p-5 rounded-xl">
          <div className="text-sm text-gray-400 font-bold mb-1">Total Payouts (All Time)</div>
          <div className="text-2xl font-black text-white">$1.24M</div>
        </div>
      </div>

      <div className="bg-[#121217] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Payout ID, Seller, or Address..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
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
                <th className="px-6 py-4 font-medium">Payout ID</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Destination Address</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-300">{payout.id}</td>
                  <td className="px-6 py-4 font-medium text-fuchsia-400">{payout.seller}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-yellow-400">{payout.amount}</div>
                    <div className="text-xs text-gray-500 mt-0.5">~ {payout.usdValue}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-bold text-gray-300">{payout.network}</span>
                      <span className="font-mono text-xs text-gray-400 truncate max-w-[150px]">{payout.address}</span>
                      <ArrowUpRight className="w-3 h-3 text-blue-400 shrink-0" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusClass(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => approvePayout(payout.id)}
                        disabled={payout.status === 'Approved & Sent' || payout.status === 'Rejected'}
                        title="Approve & Send Crypto"
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectPayout(payout.id)}
                        disabled={payout.status === 'Approved & Sent' || payout.status === 'Rejected'}
                        title="Reject Request"
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
