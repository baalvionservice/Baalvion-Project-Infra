import React from "react";

export default function DisputesPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 text-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-red-500">Dispute Center</h1>
        <p className="text-gray-400">Report incomplete work, payment mismatches, failed USDT transactions, or setup issues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold border-b border-zinc-800 pb-2">Active Disputes</h2>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Request #REQ-9021-A</h3>
                <p className="text-sm text-gray-400">Service: Purchase USDT · Member: Trade Facilitator #1042</p>
              </div>
              <span className="bg-orange-900/50 text-orange-400 border border-orange-800 text-xs px-3 py-1 rounded-full font-medium">
                Under Review
              </span>
            </div>
            
            <div className="bg-zinc-950 p-4 rounded border border-zinc-800 mb-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-1">Issue: Failed USDT Transaction</h4>
              <p className="text-sm text-gray-400">Payment was sent via PhonePe and verified, but the USDT transfer hasn't arrived on the provided TRC20 address after 4 hours.</p>
            </div>
            
            <div className="flex gap-4 items-center">
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                View Evidence
              </button>
              <button className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 px-4 py-2 rounded text-sm font-medium transition-colors">
                Add New Evidence
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Open a Dispute</h2>
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Select Service Request</label>
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500">
                  <option value="">-- Choose a Request --</option>
                  <option value="REQ-8822-B">REQ-8822-B (Account Setup)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Issue Type</label>
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500">
                  <option value="incomplete_work">Incomplete Work</option>
                  <option value="payment_mismatch">Payment Mismatch / Not Received</option>
                  <option value="failed_usdt">Failed USDT Transaction</option>
                  <option value="setup_issue">Account Setup Issue</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Details</label>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500 h-24"
                  placeholder="Explain the issue clearly..."
                />
              </div>
              <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors text-sm">
                Submit Dispute
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
