"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, AlertTriangle, MessageSquare } from "lucide-react";

export default function AgentDashboardPage() {
  const [activeTab, setActiveTab] = useState("incoming");

  return (
    <div className="max-w-7xl mx-auto p-6 text-white min-h-screen">
      <div className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-red-500">Agent Operations Center</h1>
          <p className="text-gray-400 text-sm">Manage incoming client requests, verify fiat payments, and process USDT.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Earnings</div>
          <div className="text-2xl font-bold text-green-400">₹14,500 <span className="text-sm text-gray-500 font-normal">this week</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase mb-1">Active Jobs</div>
          <div className="text-2xl font-bold">4</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase mb-1">Pending Verifications</div>
          <div className="text-2xl font-bold text-yellow-500">2</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase mb-1">Security Deposit</div>
          <div className="text-2xl font-bold text-blue-400">$1,000 <span className="text-xs text-green-500 ml-1">✓ Secured</span></div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
          <div className="text-gray-400 text-xs uppercase mb-1">Agent Rating</div>
          <div className="text-2xl font-bold text-green-500">99% <span className="text-xs text-gray-500">Positive</span></div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-zinc-800 mb-6">
        <button onClick={() => setActiveTab('incoming')} className={`px-4 py-2 font-bold ${activeTab === 'incoming' ? 'border-b-2 border-red-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          Incoming Requests
        </button>
        <button onClick={() => setActiveTab('active')} className={`px-4 py-2 font-bold ${activeTab === 'active' ? 'border-b-2 border-red-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          Active Workspaces
        </button>
      </div>

      {activeTab === 'incoming' && (
        <div className="space-y-4">
          {/* Incoming Request Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-purple-900/50 text-purple-400 border border-purple-800 text-xs px-2 py-0.5 rounded font-medium">NEW REQUEST</span>
                <span className="text-xs text-gray-500">REQ-8822-B • 5 mins ago</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Seller Account Registration (50 USDT)</h3>
              <p className="text-sm text-gray-400">Client wants to pay via <strong className="text-white">PhonePe</strong>.</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4 bg-zinc-950 p-3 rounded border border-zinc-800/50 w-fit">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">You Receive (INR)</div>
                  <div className="font-bold text-green-400">₹4,500</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">You Pay (USDT)</div>
                  <div className="font-bold text-red-400">50 USDT</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[200px]">
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors text-sm text-center">
                Accept Job
              </button>
              <button className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold py-3 px-4 rounded transition-colors text-sm text-center">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-gray-400 text-sm">
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Service</th>
                <th className="p-4 font-medium">Payment Method</th>
                <th className="p-4 font-medium">Status / Action Required</th>
                <th className="p-4 font-medium text-right">Workspace</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/50">
                <td className="p-4 font-bold text-sm">shadow_trader</td>
                <td className="p-4 text-sm text-gray-300">Purchase 500 USDT</td>
                <td className="p-4 text-sm font-mono text-gray-400">UPI QR Code</td>
                <td className="p-4">
                  <span className="flex items-center gap-2 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded w-fit border border-yellow-500/20">
                    <Clock className="w-3 h-3" /> VERIFY INR PAYMENT
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ml-auto">
                    <MessageSquare className="w-3 h-3" /> Open Chat
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
