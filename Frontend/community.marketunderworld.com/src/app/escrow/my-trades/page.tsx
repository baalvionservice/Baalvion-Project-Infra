"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  AlertCircle, 
  FileUp, 
  ShieldCheck, 
  QrCode, 
  Send, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X
} from "lucide-react";
import { getStoredTrades, appendChatMessage, updateTradeState, MOCK_AGENTS, buildUpiUri } from "@/lib/escrow-store";
import { ServiceRequest } from "@/lib/escrow-types";

export default function MyTradesPage() {
  const [trades, setTrades] = useState<ServiceRequest[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  
  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [utrRef, setUtrRef] = useState("");

  useEffect(() => {
    const list = getStoredTrades();
    setTrades(list);
    if (list.length > 0 && !selectedTradeId) {
      setSelectedTradeId(list[0].id);
    }
  }, []);

  const refreshTrades = () => {
    const list = getStoredTrades();
    setTrades(list);
  };

  const activeTrade = trades.find((t) => t.id === selectedTradeId);
  const assignedAgent = MOCK_AGENTS.find((a) => a.id === activeTrade?.memberId) || MOCK_AGENTS[0];

  const inrTotal = (activeTrade?.totalCost || 100) * 90;
  const upiUri = buildUpiUri(
    assignedAgent.upiId || "fastpay.escrow@icici",
    inrTotal,
    assignedAgent.name || "Agent",
    activeTrade?.id || "REQ-8822-B"
  );

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeTrade) return;

    appendChatMessage(activeTrade.id, {
      requestId: activeTrade.id,
      senderId: "current_user",
      senderName: "You (Buyer)",
      senderRole: "customer",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setInputText("");
    refreshTrades();
  };

  const handleSubmitProof = () => {
    if (!activeTrade || !utrRef.trim()) return;

    updateTradeState(activeTrade.id, {
      status: "payment_verification",
      paymentProviderReference: utrRef.trim()
    });

    appendChatMessage(activeTrade.id, {
      requestId: activeTrade.id,
      senderId: "current_user",
      senderName: "You (Buyer)",
      senderRole: "customer",
      text: `Submitted Fiat Payment Proof! UTR Ref: ${utrRef.trim()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setShowProofModal(false);
    setUtrRef("");
    refreshTrades();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payment_verification":
        return <span className="bg-yellow-950 text-yellow-400 border border-yellow-800 text-xs px-2.5 py-0.5 rounded font-bold">Verifying Payment</span>;
      case "in_progress":
        return <span className="bg-blue-950 text-blue-400 border border-blue-800 text-xs px-2.5 py-0.5 rounded font-bold">Agent In Progress</span>;
      case "completed":
        return <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-0.5 rounded font-bold">Completed</span>;
      default:
        return <span className="bg-zinc-900 text-zinc-400 border border-zinc-800 text-xs px-2.5 py-0.5 rounded font-bold">Created</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-white min-h-screen flex flex-col md:flex-row gap-6">
      
      {/* Left Column: Trade Directory */}
      <div className={`transition-all ${selectedTradeId ? 'w-full md:w-5/12' : 'w-full'}`}>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Escrow Workspaces</h1>
            <p className="text-zinc-400 text-xs mt-1">Manage active agent trades & fiat transfers.</p>
          </div>
          <Link href="/escrow/access-counter" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors">
            + New Trade
          </Link>
        </div>

        <div className="space-y-3">
          {trades.map((t) => (
            <div 
              key={t.id} 
              onClick={() => setSelectedTradeId(t.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedTradeId === t.id 
                  ? "bg-zinc-900 border-red-500/80 shadow-lg shadow-red-950/20" 
                  : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-sm text-white">{t.instructions || t.serviceType}</div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{t.id} • {new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                {getStatusBadge(t.status)}
              </div>

              <div className="flex justify-between items-center text-xs text-zinc-300 mt-3 pt-3 border-t border-zinc-800/60">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {t.memberName || "Verified Agent"}
                </div>
                <div className="font-bold font-mono text-emerald-400">{t.amount} USDT (≈ ₹{(t.totalCost * 90).toLocaleString()})</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Interactive Workspace & Chat */}
      {activeTrade ? (
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col h-[82vh] sticky top-20 overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">{activeTrade.id}</h2>
                <span className="text-xs text-zinc-500 font-mono">• {activeTrade.serviceType.toUpperCase()}</span>
              </div>
              <p className="text-xs text-emerald-400 font-medium">Assigned Agent: {activeTrade.memberName}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-purple-400" /> PhonePe / GPay QR
              </button>
            </div>
          </div>

          {/* Payment Guidance Bar */}
          <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-3 text-xs">
            <div>
              <span className="text-zinc-400">Total Payable: </span>
              <strong className="text-emerald-400 font-bold text-sm">₹{inrTotal.toLocaleString()} INR ({activeTrade.totalCost} USDT)</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProofModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileUp className="w-3.5 h-3.5" /> Submit Fiat Payment UTR
              </button>
              <Link 
                href="/escrow/disputes" 
                className="bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-orange-900/40 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Dispute
              </Link>
            </div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-900/50">
            <div className="text-center text-[11px] text-zinc-500 my-2 border-b border-zinc-800/80 pb-3">
              🔒 Encrypted Escrow Session • Verified Agent Deposit: <strong className="text-emerald-400">$1,000 USDT Secured</strong>
            </div>

            {(activeTrade.chatMessages || []).map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === 'current_user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-zinc-500 mb-1">{msg.senderName} • {msg.timestamp}</span>
                <div className={`p-3.5 rounded-2xl max-w-[80%] text-sm ${
                  msg.senderId === 'current_user' 
                    ? 'bg-red-600 text-white rounded-br-none' 
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type message to agent..." 
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 font-sans"
            />
            <button 
              onClick={handleSendMessage}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm">
          Select a trade workspace to view live chat & PhonePe QR details.
        </div>
      )}

      {/* Dynamic UPI / PhonePe / GPay QR Modal */}
      {showQrModal && activeTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-white text-center relative">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg mb-1">Scan & Pay via PhonePe / GPay</h3>
            <p className="text-xs text-zinc-400 mb-4">Scan with any Indian UPI app to pay agent directly.</p>

            {/* Dynamic Simulated QR Canvas */}
            <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-xl border-4 border-purple-900">
              <div className="w-48 h-48 bg-zinc-950 flex flex-col items-center justify-center text-black font-mono text-[10px] p-2 relative overflow-hidden rounded">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 pointer-events-none"></div>
                <QrCode className="w-32 h-32 text-white mb-1" />
                <span className="text-white font-bold tracking-widest">SCAN UPI QR</span>
              </div>
            </div>

            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-left space-y-2 text-xs font-mono mb-4">
              <div><span className="text-zinc-500">Agent VPA: </span><strong className="text-purple-400">{assignedAgent.upiId || "fastpay.escrow@icici"}</strong></div>
              <div><span className="text-zinc-500">Amount: </span><strong className="text-emerald-400">₹{inrTotal.toLocaleString()} INR</strong></div>
              <div><span className="text-zinc-500">Trade Ref: </span><strong className="text-white">{activeTrade.id}</strong></div>
            </div>

            <a 
              href={upiUri}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
            >
              Open Direct in PhonePe / GPay App
            </a>
          </div>
        </div>
      )}

      {/* Submit Payment Proof Modal */}
      {showProofModal && activeTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-white relative">
            <button 
              onClick={() => setShowProofModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-red-500" /> Submit Payment UTR Reference
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Enter the 12-digit UTR reference number from your PhonePe or GPay transaction receipt.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-semibold">12-Digit PhonePe / GPay UTR Reference</label>
                <input 
                  type="text" 
                  value={utrRef}
                  onChange={(e) => setUtrRef(e.target.value)}
                  placeholder="e.g. 429104829102" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="border-2 border-dashed border-zinc-800 p-4 rounded-xl text-center">
                <FileUp className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <span className="text-xs text-zinc-400 block font-semibold">Upload Payment Screenshot</span>
                <span className="text-[10px] text-zinc-600">JPG, PNG up to 5MB</span>
              </div>

              <button
                onClick={handleSubmitProof}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Notify Agent of Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
