"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Search, 
  Filter, 
  UserCheck, 
  Lock, 
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"agents" | "disputes" | "roster" | "treasury">("agents");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Mock pending agent applications
  const pendingAgents = [
    {
      id: "APP-901",
      userId: "usr_crypto_master",
      telegram: "@cryptomaster_inr",
      email: "crypto.master@gmail.com",
      appliedAt: "2026-10-10 14:22 UTC",
      depositAmount: 1000,
      paymentMethods: ["PhonePe", "GPay", "UPI QR"],
      depositTxHash: "0x89f2a49b81c201d4a3e791b82910fae7741bc294711ad8e9204128",
      network: "TRC-20 (USDT)",
      status: "pending_verification"
    },
    {
      id: "APP-902",
      userId: "usr_desibroker",
      telegram: "@desibroker99",
      email: "desibroker99@outlook.com",
      appliedAt: "2026-10-10 11:05 UTC",
      depositAmount: 1000,
      paymentMethods: ["PhonePe", "IMPS Bank Transfer"],
      depositTxHash: "0x3c990a1e4b31c00fa827bc192834fe819200aa12984bc88192801a",
      network: "BEP-20 (USDT)",
      status: "pending_verification"
    }
  ];

  // Mock open disputes
  const openDisputes = [
    {
      id: "DISP-401",
      requestId: "REQ-7721-A",
      buyer: "trader_rex",
      agent: "quick_pay_agent",
      amount: "250 USDT (₹22,500)",
      reason: "Buyer claims PhonePe payment sent, Agent claims not received",
      raisedBy: "buyer",
      evidenceSubmitted: true,
      agentDepositStatus: "$1,000 Collateral Locked",
      createdAt: "2026-10-10 09:14 UTC"
    },
    {
      id: "DISP-402",
      requestId: "REQ-8109-C",
      buyer: "shadow_node",
      agent: "inr_crypto_hub",
      amount: "1,000 USDT (₹91,000)",
      reason: "Account Setup incomplete after 24h limit",
      raisedBy: "buyer",
      evidenceSubmitted: true,
      agentDepositStatus: "$1,000 Collateral Locked",
      createdAt: "2026-10-09 20:30 UTC"
    }
  ];

  // Mock roster of active verified agents
  const activeRoster = [
    {
      id: "AGT-001",
      name: "FastPay Escrow Agent #1",
      userId: "agent_alpha",
      deposit: 1000,
      tradesCount: 142,
      rating: "99.4%",
      status: "active",
      joinedDate: "2026-08-15"
    },
    {
      id: "AGT-002",
      name: "Global Fiat Intermediary",
      userId: "agent_beta",
      deposit: 1000,
      tradesCount: 89,
      rating: "98.1%",
      status: "active",
      joinedDate: "2026-09-01"
    },
    {
      id: "AGT-003",
      name: "UPI Direct Exchange",
      userId: "agent_gamma",
      deposit: 1000,
      tradesCount: 310,
      rating: "100%",
      status: "active",
      joinedDate: "2026-07-20"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-900/60 text-red-400 border border-red-700/50 text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
              System Admin Oversight
            </span>
            <span className="text-xs text-zinc-500 font-mono">Platform v3.4 • Escrow Core</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-red-500" /> Administrative Escrow Control
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Verify agent collateral deposits, arbitrate disputes, monitor platform treasury, and maintain network integrity.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Cold Vault Collateral</div>
            <div className="text-xl font-bold text-emerald-400">$34,000 USDT</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-xs uppercase font-semibold">Pending Agent Applications</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-400">2</div>
          <div className="text-[11px] text-zinc-500 mt-1">Awaiting $1,000 deposit verification</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-xs uppercase font-semibold">Active Escalated Disputes</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-400">2</div>
          <div className="text-[11px] text-zinc-500 mt-1">Requires admin arbitration</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-xs uppercase font-semibold">Verified Intermediaries</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-400">34</div>
          <div className="text-[11px] text-zinc-500 mt-1">100% backed by $1,000 USDT deposit</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-xs uppercase font-semibold">Monthly Platform Revenue</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">$4,820 USDT</div>
          <div className="text-[11px] text-zinc-500 mt-1">0.5% fee on agent-assisted trades</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 mb-8">
        <button
          onClick={() => setActiveTab("agents")}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "agents"
              ? "border-red-500 text-white bg-red-950/20"
              : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50"
          }`}
        >
          <UserCheck className="w-4 h-4" /> Agent Applications (2)
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "disputes"
              ? "border-red-500 text-white bg-red-950/20"
              : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-400" /> Escalated Disputes (2)
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "roster"
              ? "border-red-500 text-white bg-red-950/20"
              : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Active Roster (34)
        </button>
        <button
          onClick={() => setActiveTab("treasury")}
          className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "treasury"
              ? "border-red-500 text-white bg-red-950/20"
              : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Collateral & Treasury
        </button>
      </div>

      {/* Tab 1: Agent Deposit Verifications */}
      {activeTab === "agents" && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-2 text-white">Pending Intermediary Approvals</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Verify that the applicant has deposited exactly <strong className="text-emerald-400">$1,000 USDT</strong> into the platform escrow wallet on-chain before activating their agent badge.
            </p>

            <div className="space-y-4">
              {pendingAgents.map((agent) => (
                <div key={agent.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-white">{agent.userId}</span>
                        <span className="bg-amber-900/40 text-amber-400 border border-amber-800 text-xs px-2.5 py-0.5 rounded font-mono">
                          {agent.id}
                        </span>
                        <span className="text-xs text-zinc-500">{agent.appliedAt}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-2">
                        <div>
                          <div className="text-[11px] text-zinc-500 uppercase">Contact Details</div>
                          <div className="text-zinc-300 font-mono">{agent.telegram}</div>
                          <div className="text-zinc-400 text-xs">{agent.email}</div>
                        </div>

                        <div>
                          <div className="text-[11px] text-zinc-500 uppercase">Payment Channels</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agent.paymentMethods.map((pm, i) => (
                              <span key={i} className="bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs px-2 py-0.5 rounded">
                                {pm}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-zinc-500 uppercase">Required Security Deposit</div>
                          <div className="text-emerald-400 font-bold">${agent.depositAmount} USDT</div>
                          <div className="text-xs text-zinc-400">{agent.network}</div>
                        </div>
                      </div>

                      {/* Blockchain TX Verification Box */}
                      <div className="mt-3 bg-zinc-900 border border-zinc-800/80 p-3 rounded font-mono text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                        <div className="truncate max-w-full">
                          <span className="text-zinc-500">Deposit TXID: </span>
                          <span className="text-blue-400 underline cursor-pointer">{agent.depositTxHash}</span>
                        </div>
                        <a 
                          href={`https://tronscan.org/#/transaction/${agent.depositTxHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded"
                        >
                          Explore Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-3 min-w-[200px]">
                      <button 
                        onClick={() => alert(`Agent ${agent.userId} approved! Deposit of $1,000 USDT confirmed on-chain.`)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Verify TX & Approve
                      </button>
                      <button 
                        onClick={() => alert(`Application ${agent.id} rejected.`)}
                        className="flex-1 bg-zinc-800 hover:bg-red-900/60 hover:text-red-200 text-zinc-300 font-bold py-2.5 px-4 rounded transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Reject & Refund
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Escalated Disputes & Arbitration */}
      {activeTab === "disputes" && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Dispute Arbitration Center</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  As System Admin, you hold final power to arbitrate disputed trades. You can enforce refunds from the Intermediary's $1,000 deposit if non-delivery is proven.
                </p>
              </div>
              <span className="bg-red-900/40 text-red-400 border border-red-800 text-xs px-3 py-1 rounded font-mono font-bold">
                2 Active Disputes
              </span>
            </div>

            <div className="space-y-6">
              {openDisputes.map((dispute) => (
                <div key={dispute.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-4 mb-4 gap-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-400 text-lg">{dispute.id}</span>
                        <span className="text-zinc-500 font-mono text-sm">Ref Trade: {dispute.requestId}</span>
                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-0.5 rounded">
                          Trade Vol: {dispute.amount}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      Raised {dispute.createdAt}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Complainant / Buyer</div>
                      <div className="text-white font-bold mb-1">@{dispute.buyer}</div>
                      <p className="text-sm text-zinc-300 italic bg-zinc-950 p-3 rounded border border-zinc-800">
                        "{dispute.reason}"
                      </p>
                    </div>

                    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-2">Assigned Intermediary</div>
                      <div className="text-white font-bold mb-1">@{dispute.agent}</div>
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mt-2 bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
                        <ShieldCheck className="w-4 h-4" /> {dispute.agentDepositStatus}
                      </div>
                    </div>
                  </div>

                  {/* Evidence & Action Toolbar */}
                  <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 text-sm text-zinc-300">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span>Screen Recording & Bank Receipt Submitted</span>
                      <button className="text-xs text-blue-400 underline hover:text-blue-300 font-mono">
                        View Proof Files (2)
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                      <button 
                        onClick={() => alert(`Ruled in favor of Buyer (@${dispute.buyer}). 250 USDT released to Buyer from Agent deposit.`)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex-1 lg:flex-none"
                      >
                        Refund Buyer (Seize Deposit)
                      </button>
                      <button 
                        onClick={() => alert(`Ruled in favor of Intermediary (@${dispute.agent}). Trade completed.`)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-4 py-2 rounded text-xs transition-colors flex-1 lg:flex-none"
                      >
                        Release Funds to Agent
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Verified Agent Roster */}
      {activeTab === "roster" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Active Intermediary Network</h2>
              <p className="text-sm text-zinc-400">All registered agents holding $1,000 security collateral.</p>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search agent by name..." 
                className="bg-zinc-950 border border-zinc-800 text-sm px-4 py-2 pl-9 rounded text-white focus:outline-none focus:border-red-500 w-64"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="p-4">Agent Identifier</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Escrow Deposit</th>
                <th className="p-4">Completed Trades</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRoster.map((agent) => (
                <tr key={agent.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                  <td className="p-4 font-bold text-sm text-white">{agent.name}</td>
                  <td className="p-4 text-sm text-zinc-400 font-mono">@{agent.userId}</td>
                  <td className="p-4 text-sm font-bold text-emerald-400 font-mono">${agent.deposit} USDT</td>
                  <td className="p-4 text-sm text-zinc-300 font-mono">{agent.tradesCount}</td>
                  <td className="p-4 text-sm text-emerald-400 font-bold">{agent.rating}</td>
                  <td className="p-4">
                    <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-0.5 rounded font-bold">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => alert(`Suspending agent ${agent.name}...`)}
                      className="text-xs bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-zinc-400 px-3 py-1.5 rounded transition-colors"
                    >
                      Suspend Agent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Collateral & Treasury System */}
      {activeTab === "treasury" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" /> Platform Cold Vault Collateral
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Total security deposits deposited by Verified Intermediaries currently stored in multi-sig cold storage wallets.
            </p>

            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg space-y-4 mb-6">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <span className="text-sm text-zinc-400">Active Agents Deposit Pool</span>
                <span className="text-lg font-bold text-emerald-400">$34,000 USDT</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <span className="text-sm text-zinc-400">Disputed Collateral Frozen</span>
                <span className="text-lg font-bold text-amber-400">$2,000 USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Cold Vault Multi-Sig Wallet</span>
                <span className="text-xs font-mono text-blue-400">TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t</span>
              </div>
            </div>

            <button 
              onClick={() => alert("Auditing vault balance with TRON network RPC node...")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Trigger Blockchain Vault Audit
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Fee Revenue & Distribution
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Platform earns a standard 0.5% fee on each successful fiat-to-USDT trade processed by Intermediaries.
            </p>

            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg space-y-4 mb-6">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <span className="text-sm text-zinc-400">Total Volume Processed (30d)</span>
                <span className="text-lg font-bold text-white">$964,000 USDT</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <span className="text-sm text-zinc-400">Platform Escrow Fee Collected</span>
                <span className="text-lg font-bold text-blue-400">$4,820 USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Intermediaries Earnings Paid</span>
                <span className="text-lg font-bold text-emerald-400">₹42,50,000 INR</span>
              </div>
            </div>

            <button 
              onClick={() => alert("Exporting monthly accounting report (CSV)...")}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> Download Accounting Audit Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
