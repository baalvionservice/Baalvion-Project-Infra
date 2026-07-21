"use client"

import React, { use, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Truck,
  Loader2,
  XCircle
} from 'lucide-react'
import { NexusCard } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { useRouter } from 'next/navigation'
import { getOrder, type Order } from '@/lib/api/orders'
import { MARKET_UNDERWORLD_STORE_ID } from '@/lib/api/commerce'

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getOrder(MARKET_UNDERWORLD_STORE_ID, orderId)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Order not found'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading order…
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        <XCircle className="w-16 h-16 text-red-400" />
        <p className="text-gray-400">{error || 'Order not found.'}</p>
        <NexusButton onClick={() => router.push('/')}>Return Home</NexusButton>
      </div>
    )
  }

  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-32 pb-32">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
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
            <p className="text-gray-500 text-lg">
              Thank you for your purchase{order.shippingAddress?.firstName ? `, ${order.shippingAddress.firstName}` : ''}.
              {order.shippingAddress?.email ? ` Your receipt has been sent to ${order.shippingAddress.email}.` : ''}
            </p>
          </div>
          <div className="font-mono text-sm bg-white/5 border border-white/5 px-6 py-2 rounded-full inline-block text-gray-400">
            Order: <span className="text-white font-bold">{order.orderNumber}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <NexusCard className="p-8 border-white/10 bg-white/[0.02] space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-3"><Package className="w-5 h-5 text-blue-400" /> Order Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Payment Status</span>
                <span className="font-bold capitalize">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total Amount</span>
                <span className="font-bold text-emerald-400">{order.totalAmount} {order.currencyCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Items</span>
                <span className="font-bold">{itemCount} {itemCount === 1 ? 'Product' : 'Products'}</span>
              </div>
              {order.payments[0]?.transactionId && (
                <div className="pt-4 border-t border-white/5 text-[10px] font-mono text-gray-600 break-all">
                  TX: {order.payments[0].transactionId}
                </div>
              )}
            </div>
          </NexusCard>

          <NexusCard className="p-8 border-white/10 bg-white/[0.02] space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-3"><Truck className="w-5 h-5 text-purple-400" /> Status</h3>
            <div className="space-y-6">
              <div className="relative pl-8 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                <div className="relative">
                  <div className="absolute -left-8 w-4 h-4 rounded-full bg-emerald-500 border-4 border-[#050508]" />
                  <div className="font-bold text-sm">Order Placed</div>
                  <div className="text-[10px] text-gray-500 uppercase">{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="relative">
                  <div className={`absolute -left-8 w-4 h-4 rounded-full border-4 border-[#050508] ${order.status !== 'pending' ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  <div className={`font-bold text-sm ${order.status === 'pending' ? 'text-gray-500' : ''}`}>Seller Processing</div>
                  <div className="text-[10px] text-gray-600 uppercase capitalize">{order.status}</div>
                </div>
              </div>
            </div>
          </NexusCard>
        </div>

        <div className="text-center">
          <NexusButton onClick={() => router.push('/shop')} className="gap-2">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </NexusButton>
        </div>
      </div>
    </div>
  )
}
