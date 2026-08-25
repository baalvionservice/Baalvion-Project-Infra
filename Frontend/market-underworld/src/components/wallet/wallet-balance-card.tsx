"use client"

import { Wallet, Plus } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"

/**
 * Real wallet balance only — a genuine $0.00 for a buyer who has never deposited, never a
 * placeholder/fabricated number (see the project's content-integrity rule). Deliberately not
 * modeled after src/app/student-dashboard/wallet/page.tsx, which uses mock data for an unrelated
 * product area.
 */
export function WalletBalanceCard({ balance, onDeposit }: { balance: number; onDeposit: () => void }) {
  return (
    <NexusCard className="p-6 bg-white/[0.02] border-white/5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-emerald-400" />
        </div>
        <button
          onClick={onDeposit}
          className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Funds
        </button>
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Wallet Balance</div>
        <div className="text-2xl font-bold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </NexusCard>
  )
}
