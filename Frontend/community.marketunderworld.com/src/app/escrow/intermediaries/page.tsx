"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Star, Clock, Search, ArrowRight, Award } from "lucide-react";
import { AGENTS } from "@/lib/escrow-store";

export default function IntermediariesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgents = AGENTS.filter(
    (agent) =>
      (agent.name || "Agent").toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.supportedPaymentMethods.some((pm) => pm.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto p-6 text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-950 text-red-400 border border-red-800 text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Verified Intermediary Directory
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Intermediaries</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Find an intermediary who helps with USDT purchases, crypto trades and account setup. Pay only the account shown on the intermediary page, and check the name before you send.
          </p>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agent, service or UPI..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-red-500"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          </div>

          <Link 
            href="/escrow/apply-agent" 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm whitespace-nowrap shadow-lg shadow-red-900/30"
          >
            Become an Agent
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.length === 0 && <p className="md:col-span-3 text-center text-zinc-400 py-12">No intermediaries are listed yet.</p>}
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-zinc-900 flex items-center justify-center text-lg font-bold text-white border border-red-500/30">
                    {(agent.name || "Agent").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-red-400 transition-colors">{agent.name}</h3>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        {agent.depositPaid ? `$${agent.depositAmount.toLocaleString()} deposit` : "Newly listed"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-zinc-300 mb-6 mt-4 pt-4 border-t border-zinc-800/60">
                {agent.averageResponseMinutes ? <div className="flex justify-between">
                  <span className="text-zinc-500">Avg Response Time</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {agent.averageResponseMinutes} Mins
                  </span>
                </div> : null}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Commission Rate</span>
                  <span className="text-red-400 font-semibold">{agent.commissionDetails}</span>
                </div>
                {agent.completedJobs > 0 ? <><div className="flex justify-between">
                  <span className="text-zinc-500">Completed Trades</span>
                  <span className="font-mono font-bold text-white">{agent.completedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Customer Rating</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {agent.positiveReviewPercentage}%
                  </span>
                </div></> : null}
              </div>

              {/* Supported Gateways */}
              <div className="flex flex-wrap gap-1 mb-6">
                {agent.supportedPaymentMethods.map((pm, i) => (
                  <span key={i} className="bg-zinc-950 text-zinc-300 border border-zinc-800 text-[10px] px-2 py-0.5 rounded uppercase font-mono">
                    {pm}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link 
                href={`/escrow/intermediaries/${agent.id}`}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2.5 rounded-lg text-center transition-colors"
              >
                View Profile
              </Link>
              <Link 
                href={`/escrow/intermediaries/${agent.id}`}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg text-center transition-colors flex items-center justify-center gap-1"
              >
                Hire Member <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
