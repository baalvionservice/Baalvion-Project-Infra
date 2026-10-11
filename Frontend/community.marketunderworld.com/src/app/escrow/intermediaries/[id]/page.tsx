"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Star, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  ExternalLink, 
  MessageSquare, 
  Send, 
  PhoneCall, 
  QrCode, 
  Sparkles,
  Lock,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { AGENTS, REVIEWS, createNewTrade, buildUpiUri } from "@/lib/escrow-store";
import { VerifiedMemberProfile } from "@/lib/escrow-types";

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = use(params);
  const agent = AGENTS.find((a) => a.id === agentId || a.userId === agentId);
  if (!agent) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-white min-h-screen text-center py-24">
        <h1 className="text-2xl font-bold mb-2">Intermediary not found</h1>
        <p className="text-zinc-400 mb-6">This intermediary is not listed.</p>
        <Link href="/escrow/intermediaries" className="text-red-400 hover:underline">Back to the directory</Link>
      </div>
    );
  }
  return <AgentProfile agent={agent} />;
}

function AgentProfile({ agent }: { agent: VerifiedMemberProfile }) {
  const router = useRouter();
  const agentReviews = REVIEWS.filter((r) => r.memberId === agent.id);

  // State for Instant Direct Hire Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<"buy_usdt" | "account_setup">("buy_usdt");
  const [usdtAmount, setUsdtAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<"phonepe" | "gpay" | "upi_qr">("phonepe");
  const [instructions, setInstructions] = useState<string>("");

  const inrAmount = usdtAmount * 90; // Mock rate 1 USDT = 90 INR

  const handleCreateTrade = () => {
    const trade = createNewTrade({
      memberId: agent.id,
      memberName: agent.name,
      serviceType,
      amount: usdtAmount,
      paymentMethod,
      instructions: instructions || `Direct hire with ${agent.name} for ${usdtAmount} USDT via ${paymentMethod.toUpperCase()}`
    });

    setIsModalOpen(false);
    router.push(`/escrow/my-trades?tradeId=${trade.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 text-white min-h-screen">
      {/* Back Button */}
      <div className="mb-6">
        <Link 
          href="/escrow/intermediaries" 
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Intermediaries Directory
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-zinc-900 border border-red-500/30 flex items-center justify-center text-2xl font-bold text-white shadow-xl flex-shrink-0">
              {(agent.name || "Agent").substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {agent.depositPaid ? `$${agent.depositAmount.toLocaleString()} deposit` : "Newly listed"}
                </span>
              </div>
              <p className="text-sm font-mono text-zinc-400 mb-3">@{agent.userId} • Listed since {agent.verificationDate}</p>

              <div className="flex flex-wrap gap-4 text-xs text-zinc-300">
                {agent.averageResponseMinutes ? (
                  <span className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1 rounded-md border border-zinc-800">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Avg Response: <strong className="text-white">{agent.averageResponseMinutes} mins</strong>
                  </span>
                ) : null}
                {agent.completedJobs > 0 ? (
                  <span className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1 rounded-md border border-zinc-800">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Rating: <strong className="text-white">{agent.positiveReviewPercentage}%</strong> ({agent.completedJobs} trades)
                  </span>
                ) : (
                  <span className="bg-zinc-950 px-3 py-1 rounded-md border border-zinc-800">No completed trades yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
            >
              <Sparkles className="w-4 h-4" /> Hire Intermediary Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Bio, Proof, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Agent Bio & Collateral Proof */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 text-white">About Intermediary</h2>
            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              {agent.bio}
            </p>

            {agent.depositPaid && agent.depositTxHash ? (
            <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Security Deposit Collateral</span>
                <span className="text-emerald-400 font-bold">${agent.depositAmount.toLocaleString()} USDT</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Blockchain Transaction Hash</span>
                <a 
                  href={`https://tronscan.org/#/transaction/${agent.depositTxHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[220px]"
                >
                  {agent.depositTxHash} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Disputes Upheld Against Agent</span>
                <span className="text-emerald-400 font-bold">{agent.disputesUpheldCount}</span>
              </div>
            </div>
            ) : null}
          </div>

          {/* Customer Reviews & Feedback */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Customer Ratings & Reviews ({agentReviews.length})
            </h2>

            <div className="space-y-4">
              {agentReviews.length === 0 && <p className="text-sm text-zinc-400">No reviews yet. Reviews appear here after real trades.</p>}
              {agentReviews.map((rev) => (
                <div key={rev.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{rev.reviewerName}</span>
                      <span className="bg-zinc-900 text-zinc-400 text-[10px] px-2 py-0.5 rounded border border-zinc-800">
                        Verified Buyer
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 italic">"{rev.comment}"</p>
                  <div className="text-[11px] text-zinc-500 mt-2 text-right">{rev.createdAt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Accepted Payment Gateways & Stats */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Pay by scanning</h3>
            <div className="space-y-5">
              {(agent.paymentQrs ?? []).map((q) => (
                <div key={q.url} className="space-y-2">
                  <p className="text-xs font-bold text-white">{q.label}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={q.url} alt={`${agent.name} ${q.label} QR`} className="mx-auto w-full max-w-[260px] rounded-lg border border-zinc-800 bg-white" />
                </div>
              ))}
              <p className="text-[11px] text-zinc-400">
                Scan with any UPI app. The name shown must be <strong className="text-white">{agent.name}</strong>; if it is different, do not pay.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-1">Before you pay</h3>
            <p className="text-xs text-zinc-400 leading-normal">
              You pay this intermediary directly. Baalvion does not hold your money in this flow. Agree the amount and fee in the trade chat, and keep your payment screenshot. Report any problem from the Disputes page.
            </p>
          </div>
        </div>
      </div>

      {/* Instant Direct Hire Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 text-white relative">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500" /> Hire {agent.name}
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Start a trade request with this intermediary.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 font-semibold mb-1">Select Service</label>
                <select 
                  value={serviceType} 
                  onChange={(e: any) => setServiceType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="buy_usdt">Purchase USDT with PhonePe / GPay</option>
                  <option value="account_setup">Seller Account Access Fee (50 USDT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-semibold mb-1">USDT Amount</label>
                <input 
                  type="number" 
                  value={usdtAmount} 
                  onChange={(e) => setUsdtAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white font-bold focus:outline-none focus:border-red-500"
                />
                <div className="text-xs text-emerald-400 font-mono mt-1">
                  You Pay in Fiat: ≈ ₹{inrAmount.toLocaleString()} INR
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-semibold mb-1">Preferred Fiat Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("phonepe")}
                    className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                      paymentMethod === "phonepe" ? "bg-purple-950 border-purple-500 text-purple-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    PhonePe
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gpay")}
                    className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                      paymentMethod === "gpay" ? "bg-blue-950 border-blue-500 text-blue-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    Google Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi_qr")}
                    className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                      paymentMethod === "upi_qr" ? "bg-emerald-950 border-emerald-500 text-emerald-300" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    UPI QR Code
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 font-semibold mb-1">Instructions / Note for Agent</label>
                <textarea 
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Please transfer 100 USDT to my TRON wallet after PhonePe payment..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTrade}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm & Start Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
