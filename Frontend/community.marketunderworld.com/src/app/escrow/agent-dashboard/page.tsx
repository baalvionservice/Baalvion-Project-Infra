"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredTrades } from "@/lib/escrow-store";
import type { ServiceRequest } from "@/lib/escrow-types";

// Counts come from the trades this browser holds. Nothing here is estimated or pre-filled.
export default function AgentDashboardPage() {
  const [trades, setTrades] = useState<ServiceRequest[]>([]);
  useEffect(() => { setTrades(getStoredTrades()); }, []);

  const active = trades.filter((t) => ["created", "member_assigned", "payment_verification", "in_progress"].includes(t.status)).length;
  const waiting = trades.filter((t) => t.status === "payment_verification").length;
  const done = trades.filter((t) => t.status === "completed").length;

  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      <div className="mb-8 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold mb-2 text-red-500">Agent Operations</h1>
        <p className="text-gray-400 text-sm">Requests from customers, payments to check, and completed trades.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase mb-1">Active requests</div>
          <div className="text-2xl font-bold">{active}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase mb-1">Payments to check</div>
          <div className="text-2xl font-bold text-yellow-500">{waiting}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-500">{done}</div>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-zinc-400">
          No trade requests yet. They appear here when a customer starts one.
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((t) => (
            <Link key={t.id} href={`/escrow/my-trades?tradeId=${t.id}`} className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="font-mono text-white">{t.id}</span>
                <span className="text-zinc-400">{t.status.replace(/_/g, " ")}</span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">{t.serviceType.replace(/_/g, " ")} · {t.amount} USDT · {t.memberName}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
