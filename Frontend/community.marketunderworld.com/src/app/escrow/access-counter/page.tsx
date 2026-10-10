"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function AccessCounterPage() {
  const [hasCrypto, setHasCrypto] = useState<boolean | null>(null);
  const [accessType, setAccessType] = useState<string>("seller");

  // Pricing config
  const pricing: Record<string, { usdt: number; inr: number }> = {
    seller: { usdt: 50, inr: 4350 },
    premium: { usdt: 100, inr: 8700 },
  };
  const agentCommission = 150; // INR

  const selectedPrice = pricing[accessType];

  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      <div className="text-center mb-10 mt-8">
        <h1 className="text-4xl font-bold mb-4 text-red-500">Marketplace Access Portal</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Pay the platform fee to unlock your Seller or VIP access. You can pay directly in USDT or use a Verified Agent if you only have INR.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Step 1: Select Access */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 h-fit">
          <h2 className="text-2xl font-bold mb-6">1. Select Access Type</h2>
          
          <div className="space-y-4">
            <label className={`border p-4 rounded-lg cursor-pointer transition-colors flex items-start gap-4 relative ${accessType === 'seller' ? 'border-red-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-950 hover:border-red-500/50'}`}>
              <input 
                type="radio" 
                name="access_type" 
                value="seller" 
                checked={accessType === "seller"}
                onChange={() => setAccessType("seller")}
                className="mt-1 accent-red-500" 
              />
              <div>
                <span className="block font-bold text-lg text-white">Seller Account Registration</span>
                <span className="text-sm text-gray-400 mt-1 block">Unlock the ability to create listings and sell products in the marketplace.</span>
                <span className="block mt-2 font-mono text-red-400">Platform Fee: 50 USDT</span>
              </div>
            </label>

            <label className={`border p-4 rounded-lg cursor-pointer transition-colors flex items-start gap-4 relative ${accessType === 'premium' ? 'border-red-500 bg-zinc-800' : 'border-zinc-800 bg-zinc-950 hover:border-red-500/50'}`}>
              <input 
                type="radio" 
                name="access_type" 
                value="premium" 
                checked={accessType === "premium"}
                onChange={() => setAccessType("premium")}
                className="mt-1 accent-red-500" 
              />
              <div>
                <span className="block font-bold text-lg text-white">VIP Membership Pass</span>
                <span className="text-sm text-gray-400 mt-1 block">Get access to premium forums, lower trading fees, and priority support.</span>
                <span className="block mt-2 font-mono text-red-400">Platform Fee: 100 USDT</span>
              </div>
            </label>
          </div>
        </div>

        {/* Step 2: Payment Method */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">2. Payment Method</h2>
          
          <div className="mb-6 space-y-3">
            <label className="text-sm font-medium text-gray-300">How would you like to pay?</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setHasCrypto(true)}
                className={`flex-1 py-3 px-4 rounded border text-sm font-bold transition-colors ${hasCrypto === true ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:border-red-500/50'}`}
              >
                Direct USDT (Crypto)
              </button>
              <button 
                onClick={() => setHasCrypto(false)}
                className={`flex-1 py-3 px-4 rounded border text-sm font-bold transition-colors ${hasCrypto === false ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:border-red-500/50'}`}
              >
                INR (PhonePe / GPay)
              </button>
            </div>
          </div>

          {/* Direct Crypto Payment Flow */}
          {hasCrypto === true && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 text-center mb-6">
                <p className="text-sm text-gray-400 mb-2">Send exactly</p>
                <p className="text-3xl font-bold text-green-400 mb-4">{selectedPrice.usdt} USDT</p>
                <div className="bg-white p-4 inline-block rounded mb-4">
                  {/* Placeholder for QR Code */}
                  <div className="w-32 h-32 bg-gray-200 border-4 border-white flex items-center justify-center">
                    <span className="text-black text-xs font-bold">QR CODE</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1">Network: TRC20</p>
                <p className="text-sm font-mono bg-zinc-900 p-2 rounded break-all border border-zinc-800">
                  TXYZ1234567890MarketplaceAddress
                </p>
              </div>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-md transition-colors text-lg">
                I Have Sent the USDT
              </button>
              <p className="text-xs text-center text-gray-500 mt-3">
                Automatic confirmation within 1-3 minutes of blockchain network verification.
              </p>
            </div>
          )}

          {/* Verified Agent Fiat Flow */}
          {hasCrypto === false && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <form className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Assign a Verified Agent</label>
                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-red-500 text-sm">
                    <option value="1">Agent #402 (Online - Fast Processing)</option>
                    <option value="2">Agent #991 (Online)</option>
                  </select>
                </div>

                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm">
                  <p className="font-semibold text-gray-200 mb-3 border-b border-zinc-800 pb-2">Estimated INR Cost</p>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Access Fee ({selectedPrice.usdt} USDT)</span>
                    <span>₹{selectedPrice.inr.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Agent Commission</span>
                    <span className="text-red-400">₹{agentCommission}</span>
                  </div>
                  <div className="flex justify-between py-2 mt-2 border-t border-zinc-800 font-bold text-lg text-white">
                    <span>Total to pay Agent</span>
                    <span className="text-green-500">₹{(selectedPrice.inr + agentCommission).toLocaleString()}</span>
                  </div>
                </div>

                <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-md transition-colors text-lg mt-2">
                  Proceed to Pay Agent
                </button>
                <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded text-xs text-blue-200 mt-4">
                  <strong className="block mb-1">Checking Process:</strong>
                  Once you pay via PhonePe/GPay, the Agent checks the payment. Approval typically takes ~3 minutes. After approval, the Agent will immediately purchase the access for you.
                </div>
              </form>
            </div>
          )}
          
          {hasCrypto === null && (
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg text-gray-500 text-sm">
              Please select your payment method above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
