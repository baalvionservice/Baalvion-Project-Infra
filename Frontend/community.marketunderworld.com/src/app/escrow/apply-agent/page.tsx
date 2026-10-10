import React from "react";
import Link from "next/link";

export default function ApplyAgentPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-white min-h-screen">
      <div className="text-center mb-10 mt-8">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Become a Verified Agent</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Earn commissions by facilitating trades, purchasing USDT for clients, and managing escrow. To guarantee trust and prevent fraud, all agents must deposit a refundable $1,000 USDT Security Deposit to the platform admin.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 border-b border-zinc-800 pb-4">Agent Application & Deposit</h2>
        
        <div className="space-y-6">
          <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg">
            <h3 className="font-bold text-red-400 mb-2">Security Deposit Requirement</h3>
            <p className="text-sm text-gray-300">
              You must deposit <strong className="text-white">1000 USDT</strong> to the marketplace admin wallet. This deposit is held in custody and ensures you do not run away with customer funds. If you decide to leave the program in good standing, it will be refunded.
            </p>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Your Full Legal Name (Matches KYC)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-red-500" 
                placeholder="John Doe" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Services You Will Offer</label>
              <div className="space-y-2 text-sm text-gray-400">
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-red-500" defaultChecked /> Buy USDT for customers via PhonePe/GPay</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-red-500" defaultChecked /> Facilitate Crypto Trades</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-red-500" /> Account Setup Assistance</label>
              </div>
            </div>

            {/* Deposit Instructions */}
            <div className="mt-8 bg-zinc-950 p-6 rounded-lg border border-zinc-800 text-center">
              <p className="text-sm text-gray-400 mb-2">Send your security deposit of</p>
              <p className="text-3xl font-bold text-green-400 mb-4">1000 USDT</p>
              <div className="bg-white p-4 inline-block rounded mb-4">
                <div className="w-32 h-32 bg-gray-200 border-4 border-white flex items-center justify-center">
                  <span className="text-black text-xs font-bold text-center">ADMIN QR<br/>CODE</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Network: TRC20</p>
              <p className="text-sm font-mono bg-zinc-900 p-2 rounded break-all border border-zinc-800">
                TAdminWallet1000DepositVaultAddress
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Transaction Hash (TXID)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-red-500 font-mono text-sm" 
                placeholder="Enter the TXID after sending..." 
              />
            </div>

            <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-md transition-colors text-lg mt-4">
              Submit Application & Deposit
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              The admin team will review your KYC and verify your deposit on the blockchain within 24 hours.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
