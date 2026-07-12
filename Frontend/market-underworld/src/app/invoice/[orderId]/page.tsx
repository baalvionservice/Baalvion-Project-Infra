"use client"

import React, { use } from 'react'
import { motion } from 'framer-motion'
import { 
  Printer, 
  Download, 
  Mail, 
  Share2, 
  ArrowLeft,
  CheckCircle2,
  Globe
} from 'lucide-react'
import { NexusButton } from '@/components/ui/nexus-button'
import Link from 'next/link'

export default function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.orderId

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#050508] pt-24 pb-32 flex flex-col items-center print:bg-white print:pt-0 print:pb-0">
      
      {/* Top Actions - Hidden on Print */}
      <div className="w-full max-w-[800px] mb-8 px-6 flex justify-between items-center print:hidden">
        <Link href="/checkout">
          <NexusButton variant="ghost" className="text-gray-500 hover:text-white gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </NexusButton>
        </Link>
        <div className="flex gap-2">
          <NexusButton variant="outline" size="sm" className="border-white/10" onClick={handlePrint}><Printer className="w-4 h-4" /></NexusButton>
          <NexusButton variant="outline" size="sm" className="border-white/10" onClick={() => alert('PDF generation mock')}><Download className="w-4 h-4" /></NexusButton>
          <NexusButton variant="outline" size="sm" className="border-white/10"><Mail className="w-4 h-4" /></NexusButton>
          <NexusButton variant="outline" size="sm" className="border-white/10"><Share2 className="w-4 h-4" /></NexusButton>
        </div>
      </div>

      {/* Main Invoice Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[800px] bg-[#FAFAFA] shadow-3xl overflow-hidden relative print:shadow-none print:max-w-full print:w-full"
      >
        {/* Holographic Stamp Mock */}
        <div className="absolute top-48 right-12 w-48 h-48 border-4 border-emerald-500/20 rounded-full flex items-center justify-center rotate-[15deg] opacity-[0.15] pointer-events-none select-none">
          <div className="text-center font-bold text-emerald-600 uppercase">
            <div className="text-2xl">NEXUS</div>
            <div className="text-[10px] tracking-widest">VERIFIED ✓</div>
            <div className="text-xs">PAID</div>
          </div>
        </div>

        <div className="p-16 space-y-12">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center text-white font-bold">NX</div>
                <div className="font-bold text-xl text-[#1A1A2E] tracking-tight uppercase">NEXUS Marketplace</div>
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">
                nexus.io • marketplace@nexus.io <br />
                Registered: Global Platform Ltd. <br />
                Node: South Asia Node #847
              </div>
            </div>
            <div className="text-right space-y-2">
              <h1 className="text-5xl font-black text-[#1A1A2E] tracking-tighter uppercase italic">Invoice</h1>
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-400">INV-2026-{orderId.split('-')[2] || '08472'}</div>
                <div className="text-xs font-bold text-[#1A1A2E]">March 10, 2026</div>
                <div className="mt-4 bg-emerald-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full inline-block shadow-lg shadow-emerald-500/20">✅ PAID</div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-purple-500/20 via-transparent to-transparent" />

          {/* Billing Info */}
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bill To:</div>
              <div className="text-[#1A1A2E]">
                <div className="font-bold text-lg mb-1">Aryan Mehta</div>
                <div className="text-xs text-gray-500 leading-relaxed font-medium">
                  42 MG Road, Indiranagar <br />
                  Bangalore, Karnataka 560038 <br />
                  India 🇮🇳 <br />
                  aryan@nexus.io
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sold By:</div>
              <div className="text-[#1A1A2E]">
                <div className="font-bold text-lg mb-1 flex items-center gap-2">TechGadgets Store <CheckCircle2 className="w-4 h-4 text-blue-500" /></div>
                <div className="text-xs text-gray-500 leading-relaxed font-medium">
                  nexus.io/store/techgadgets <br />
                  support@techgadgets.io <br />
                  Blockchain Verified Seller <br />
                  South Asia Region 🌿
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden rounded-2xl border border-[#E0E0E8]">
            <table className="w-full text-left">
              <thead className="bg-[#1A1A2E] text-white">
                <tr>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest">#</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest">Item Description</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center">Qty</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-right">Unit Price</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E8] text-[#1A1A2E]">
                {[
                  { id: 1, name: 'AirPods Pro 3', variant: 'White', price: 180 },
                  { id: 2, name: 'iPhone 16 Pro', variant: '256GB • Titanium', price: 1200 },
                  { id: 3, name: 'Apple Watch Ultra 2', variant: '49mm Titanium', price: 750 }
                ].map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5FA]'}>
                    <td className="p-4 text-xs font-bold text-gray-400">{idx + 1}</td>
                    <td className="p-4">
                      <div className="text-sm font-bold">{item.name}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">{item.variant}</div>
                    </td>
                    <td className="p-4 text-sm font-bold text-center">1</td>
                    <td className="p-4 text-sm font-bold text-right">{item.price}.00 USDT</td>
                    <td className="p-4 text-sm font-black text-right">{item.price}.00 USDT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-start pt-8">
            <div className="max-w-[300px] space-y-6">
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-4">
                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Blockchain Verification
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 font-bold">Network:</span>
                    <span className="text-[#1A1A2E] font-bold">Ethereum Mainnet</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 font-bold">Block:</span>
                    <span className="text-[#1A1A2E] font-bold">#19,284,742</span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 break-all leading-relaxed">
                    TX: 0x4f2a7b9c8d3e2b5f...
                  </div>
                </div>
                <div className="pt-4 flex justify-center">
                  <div className="w-20 h-20 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-[8px] text-gray-300 font-bold uppercase">Mock QR</div>
                </div>
              </div>
            </div>

            <div className="w-[300px] space-y-4">
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Subtotal</span>
                <span>2,130.00 USDT</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-600">
                <span>Discount (NEXUS10)</span>
                <span>-213.00 USDT</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Shipping (Standard)</span>
                <span>12.00 USDT</span>
              </div>
              <div className="h-px bg-[#E0E0E8]" />
              <div className="flex justify-between items-end">
                <span className="text-lg font-black text-[#1A1A2E] uppercase">Total</span>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#1A1A2E] tracking-tighter">1,929.00 USDT</div>
                  <div className="text-xs text-gray-500 font-bold">≈ 0.665 ETH</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-12 border-t border-[#E0E0E8] flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            <div>Page 1 of 1</div>
            <div>Generated by NEXUS Engine v2.4</div>
            <div>nexus.io</div>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .print-hidden { display: none !important; }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>
    </div>
  )
}
