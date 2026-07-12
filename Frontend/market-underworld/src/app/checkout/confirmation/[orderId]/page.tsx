"use client"

import React, { use } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  Package, 
  FileText, 
  MessageSquare, 
  ArrowRight, 
  MapPin, 
  Truck,
  Download,
  Share2
} from 'lucide-react'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.orderId
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        {/* Success Hero */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-[#00E676] mx-auto shadow-2xl shadow-emerald-500/20 border border-emerald-500/30"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Order Confirmed! 🎉</h1>
            <p className="text-gray-500 text-lg">Thank you for your purchase, Aryan. Your receipt has been sent to aryan@nexus.io</p>
          </div>
          <div className="font-mono text-sm bg-white/5 border border-white/5 px-6 py-2 rounded-full inline-block text-gray-400">
            Order ID: <span className="text-white font-bold">{orderId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Summary Card */}
          <NexusCard className="p-8 border-white/10 bg-white/[0.02] space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-3"><Package className="w-5 h-5 text-blue-400" /> Order Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Payment Method</span>
                <span className="font-bold">Cryptocurrency (ETH)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total Amount</span>
                <span className="font-bold text-emerald-400">0.665 ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Items</span>
                <span className="font-bold">3 Products</span>
              </div>
              <div className="pt-4 border-t border-white/5 text-[10px] font-mono text-gray-600 break-all">
                TX: 0x4f2a7b9c8d3e2b5f...
              </div>
            </div>
            <Link href={`/invoice/${orderId}`}>
              <NexusButton variant="outline" className="w-full border-white/10 h-12 text-xs font-bold gap-2">
                <FileText className="w-4 h-4" /> View Full Invoice
              </NexusButton>
            </Link>
          </NexusCard>

          {/* Shipping & Tracking */}
          <NexusCard className="p-8 border-white/10 bg-white/[0.02] space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-3"><Truck className="w-5 h-5 text-purple-400" /> Tracking</h3>
            <div className="space-y-6">
              <div className="relative pl-8 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                <div className="relative">
                  <div className="absolute -left-8 w-4 h-4 rounded-full bg-emerald-500 border-4 border-[#050508]" />
                  <div className="font-bold text-sm">Order Placed</div>
                  <div className="text-[10px] text-gray-500 uppercase">Today, 2:15 PM</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-8 w-4 h-4 rounded-full bg-white/10 border-4 border-[#050508]" />
                  <div className="font-bold text-sm text-gray-500">Seller Processing</div>
                  <div className="text-[10px] text-gray-600 uppercase">Estimated Today</div>
                </div>
              </div>
              <NexusButton className="w-full bg-white/5 border border-white/10 text-white h-12 text-xs font-bold gap-2 hover:bg-white/10">
                🔔 Enable Notifications
              </NexusButton>
            </div>
          </NexusCard>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Download PDF', icon: Download, action: () => alert('Downloading invoice...') },
            { label: 'Share Order', icon: Share2, action: () => alert('Share link copied!') },
            { label: 'Message Seller', icon: MessageSquare, action: () => router.push('/messages') },
            { label: 'Continue Shop', icon: ArrowRight, action: () => router.push('/marketplace') }
          ].map((act, i) => (
            <button 
              key={i} 
              onClick={act.action}
              className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center gap-3 text-center group"
            >
              <act.icon className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{act.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
