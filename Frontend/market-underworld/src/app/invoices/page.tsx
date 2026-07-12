"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const MOCK_INVOICES = Array.from({ length: 10 }).map((_, i) => ({
  id: `INV-2026-0${1248 - i}`,
  date: `Mar ${10 - i}, 2026`,
  items: i % 3 === 0 ? '3 Products' : i % 2 === 0 ? 'Private Class' : 'Material Bundle',
  amount: (150 + i * 42).toFixed(2),
  eth: (0.05 + i * 0.01).toFixed(3),
  status: 'Paid',
  type: i % 3 === 0 ? 'Marketplace' : i % 2 === 0 ? 'Education' : 'Content'
}))

export default function InvoicesListPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Invoices</h1>
            <p className="text-gray-500 font-medium text-lg">Manage and download your crypto transaction history.</p>
          </div>
          <div className="flex gap-3">
            <NexusButton variant="outline" className="border-white/5"><Download className="w-4 h-4 mr-2" /> Export All (CSV)</NexusButton>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Spent', val: '3.24 ETH', sub: '≈ $9,396 USD', icon: CreditCard, color: 'text-blue-400' },
            { label: 'Invoices', val: '23', sub: 'Paid across platform', icon: FileText, color: 'text-purple-400' },
            { label: 'Avg Order', val: '0.14 ETH', sub: '↑ +5% vs last mo', icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Pending', val: '0', sub: 'All accounts clear', icon: Clock, color: 'text-gray-500' },
          ].map((stat, i) => (
            <NexusCard key={i} className="p-6 bg-white/[0.02] border-white/5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.val}</div>
                <div className="text-[10px] font-bold text-gray-600">{stat.sub}</div>
              </div>
            </NexusCard>
          ))}
        </div>

        {/* Filters */}
        <NexusCard className="p-6 bg-white/[0.02] border-white/5 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl overflow-x-auto no-scrollbar">
            {['All', 'Education', 'Marketplace', 'Content'].map(t => (
              <button key={t} className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${t === 'All' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <Input 
                className="bg-black/40 border-white/10 h-11 pl-11" 
                placeholder="Search invoice #..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <NexusButton variant="outline" className="h-11 border-white/10 text-gray-500"><Filter className="w-4 h-4" /></NexusButton>
          </div>
        </NexusCard>

        {/* Table */}
        <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
          <table className="w-full text-left">
            <thead className="bg-white/[0.01] border-b border-white/5">
              <tr>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Invoice #</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Items</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_INVOICES.filter(inv => inv.id.includes(search)).map((inv, idx) => (
                <motion.tr 
                  key={inv.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-white/[0.01] transition-colors group"
                >
                  <td className="p-6">
                    <div className="font-mono text-sm font-bold text-gray-400 group-hover:text-blue-400 transition-colors">{inv.id}</div>
                    <div className="text-[9px] text-gray-600 font-bold uppercase">{inv.type}</div>
                  </td>
                  <td className="p-6 text-sm font-medium">{inv.date}</td>
                  <td className="p-6 text-sm text-gray-400 font-medium">{inv.items}</td>
                  <td className="p-6 text-right">
                    <div className="font-bold text-sm text-white">{inv.amount} USDT</div>
                    <div className="text-[9px] text-gray-500 font-bold">≈ {inv.eth} ETH</div>
                  </td>
                  <td className="p-6 text-center">
                    <NexusBadge variant="success" className="bg-emerald-500/10 text-emerald-400 border-none px-4">Paid</NexusBadge>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/invoice/NX-2026-${inv.id.split('-')[2]}`}>
                        <button className="p-2 text-gray-600 hover:text-white transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                      </Link>
                      <button className="p-2 text-gray-600 hover:text-white transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span>Showing 10 of 23 invoices</span>
            <div className="flex gap-2">
              <NexusButton variant="outline" size="sm" className="h-10 border-white/5 px-6" disabled>Previous</NexusButton>
              <NexusButton variant="outline" size="sm" className="h-10 border-white/5 px-6">Next Page</NexusButton>
            </div>
          </div>
        </NexusCard>
      </div>
    </div>
  )
}
