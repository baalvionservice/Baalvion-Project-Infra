"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  CreditCard,
  TrendingUp,
  Clock,
  Package,
  Loader2
} from 'lucide-react'
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card'
import { NexusButton } from '@/components/ui/nexus-button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { listMyOrders, type Order } from '@/lib/api/orders'
import { MARKET_UNDERWORLD_STORE_ID } from '@/lib/api/commerce'

const STATUS_VARIANT: Record<Order['paymentStatus'], 'success' | 'warning' | 'default'> = {
  paid: 'success',
  pending: 'warning',
  authorized: 'warning',
  partially_paid: 'warning',
  refunded: 'default',
  voided: 'default',
  failed: 'default',
}

export default function OrdersListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/auth/signin?redirect=/invoices'); return; }
    listMyOrders(MARKET_UNDERWORLD_STORE_ID)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  const filtered = useMemo(
    () => orders.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase())),
    [orders, search]
  );

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === 'paid');
    const totalSpent = paid.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const pending = orders.filter((o) => o.paymentStatus === 'pending').length;
    const currency = orders[0]?.currencyCode || 'USD';
    return {
      totalSpent: `${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`,
      count: orders.length,
      avg: paid.length ? `${(totalSpent / paid.length).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}` : `0 ${currency}`,
      pending,
    };
  }, [orders]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050508] text-white pt-24 pb-32 flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading your orders…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Orders</h1>
            <p className="text-gray-500 font-medium text-lg">Your real order and payment history on Market Underworld.</p>
          </div>
          <Link href="/returns">
            <NexusButton variant="outline" className="border-white/10">Returns</NexusButton>
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Spent', val: stats.totalSpent, icon: CreditCard, color: 'text-blue-400' },
            { label: 'Orders', val: String(stats.count), icon: FileText, color: 'text-purple-400' },
            { label: 'Avg Order', val: stats.avg, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Pending', val: String(stats.pending), icon: Clock, color: 'text-gray-500' },
          ].map((stat, i) => (
            <NexusCard key={i} className="p-6 bg-white/[0.02] border-white/5 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.val}</div>
              </div>
            </NexusCard>
          ))}
        </div>

        <NexusCard className="p-6 bg-white/[0.02] border-white/5 flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              className="bg-black/40 border-white/10 h-11 pl-11"
              placeholder="Search order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </NexusCard>

        {error ? (
          <NexusCard className="p-16 text-center border-white/5 bg-white/[0.02] text-red-400">{error}</NexusCard>
        ) : filtered.length === 0 ? (
          <NexusCard className="p-16 text-center border-white/5 bg-white/[0.02] space-y-4">
            <Package className="w-10 h-10 text-gray-700 mx-auto" />
            <p className="text-gray-500 font-medium">{orders.length === 0 ? "You haven't placed any orders yet." : 'No orders match your search.'}</p>
            {orders.length === 0 && <Link href="/shop"><NexusButton>Browse Products</NexusButton></Link>}
          </NexusCard>
        ) : (
          <NexusCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
            <table className="w-full text-left">
              <thead className="bg-white/[0.01] border-b border-white/5">
                <tr>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order #</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Items</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                  <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-white/[0.01] transition-colors group"
                  >
                    <td className="p-6">
                      <div className="font-mono text-sm font-bold text-gray-400 group-hover:text-blue-400 transition-colors">{order.orderNumber}</div>
                    </td>
                    <td className="p-6 text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-6 text-sm text-gray-400 font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</td>
                    <td className="p-6 text-right">
                      <div className="font-bold text-sm text-white">{order.totalAmount} {order.currencyCode}</div>
                    </td>
                    <td className="p-6 text-center">
                      <NexusBadge variant={STATUS_VARIANT[order.paymentStatus]}>{order.paymentStatus}</NexusBadge>
                    </td>
                    <td className="p-6 text-right">
                      <Link href={`/checkout/confirmation/${order.id}`}>
                        <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest">View</button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </NexusCard>
        )}
      </div>
    </div>
  )
}
