import React from "react";
import Link from "next/link";

export default function CreateTradePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-red-500">Request a Service or Trade</h1>
      <p className="text-gray-400 mb-8">Connect with a verified human member to facilitate a USDT purchase, crypto transaction, or account setup assistance.</p>

      <form className="space-y-6 bg-zinc-900 p-8 rounded-lg border border-zinc-800">
        
        {/* Service Selection */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-300">What do you need help with?</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="border border-zinc-800 bg-zinc-950 p-4 rounded cursor-pointer hover:border-red-500 hover:bg-zinc-800 transition-colors flex flex-col gap-2 relative">
              <input type="radio" name="service_type" value="buy_usdt" className="absolute top-4 right-4 accent-red-500" defaultChecked />
              <span className="font-bold text-red-400">Purchase USDT</span>
              <span className="text-xs text-gray-500">Get assistance buying USDT securely.</span>
            </label>
            <label className="border border-zinc-800 bg-zinc-950 p-4 rounded cursor-pointer hover:border-red-500 hover:bg-zinc-800 transition-colors flex flex-col gap-2 relative">
              <input type="radio" name="service_type" value="crypto_trade" className="absolute top-4 right-4 accent-red-500" />
              <span className="font-bold text-red-400">Crypto Transaction</span>
              <span className="text-xs text-gray-500">Secure facilitation of a crypto transfer.</span>
            </label>
            <label className="border border-zinc-800 bg-zinc-950 p-4 rounded cursor-pointer hover:border-red-500 hover:bg-zinc-800 transition-colors flex flex-col gap-2 relative">
              <input type="radio" name="service_type" value="account_setup" className="absolute top-4 right-4 accent-red-500" />
              <span className="font-bold text-red-400">Account Setup</span>
              <span className="text-xs text-gray-500">Help with account creation and verification.</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Detailed Instructions</label>
          <textarea 
            className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-red-500 h-24" 
            placeholder="Describe exactly what you need the verified member to do..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Transaction Amount</label>
            <input 
              type="number" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-red-500" 
              placeholder="e.g., 5000" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Payment Method (INR)</label>
            <select className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-red-500">
              <option value="upi_qr">UPI QR Code</option>
              <option value="upi_id">UPI ID Transfer</option>
              <option value="gpay">Google Pay</option>
              <option value="phonepe">PhonePe</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Assign a Verified Member</label>
          <div className="flex gap-4 items-center">
            <select className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-red-500">
              <option value="">-- Let the platform auto-assign a member --</option>
              <option value="1">Trade Facilitator #1042 (Specializes in USDT)</option>
              <option value="2">Verified Escrow Admin (Specializes in Setup)</option>
            </select>
            <Link href="/escrow/intermediaries" className="text-red-500 hover:text-red-400 text-sm font-medium whitespace-nowrap">
              Browse Members
            </Link>
          </div>
          <p className="text-xs text-gray-500">The verified member will earn a commission upon successful completion of the work.</p>
        </div>

        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 text-sm text-gray-400">
          <p className="font-semibold text-gray-200 mb-2">Estimated Cost</p>
          <div className="flex justify-between py-1 border-b border-zinc-800"><span>Service Amount</span><span>₹5,000</span></div>
          <div className="flex justify-between py-1 border-b border-zinc-800"><span>Member Commission</span><span className="text-red-400">₹100</span></div>
          <div className="flex justify-between py-1 font-bold text-white mt-2"><span>Total You Pay</span><span className="text-green-500">₹5,100</span></div>
        </div>

        <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-md transition-colors">
          Submit Request
        </button>
      </form>
    </div>
  );
}
