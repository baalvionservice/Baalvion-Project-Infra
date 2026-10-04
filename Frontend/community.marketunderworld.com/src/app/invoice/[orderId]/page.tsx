"use client"

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { NexusButton } from '@/components/ui/nexus-button'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { getOrder, type Order, type OrderAddressInput } from '@/lib/api/orders'
import { MARKET_UNDERWORLD_STORE_ID } from '@/lib/api/commerce'

const money = (value: string | number, currency: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value))

function Address({ address }: { address: OrderAddressInput | null }) {
  if (!address) return <div className="text-xs text-gray-500">Not provided</div>
  return (
    <div className="text-xs text-gray-500 leading-relaxed font-medium">
      <div className="font-bold text-lg mb-1 text-[#1A1A2E]">{address.firstName} {address.lastName}</div>
      {address.address1}
      {address.address2 ? <>, {address.address2}</> : null} <br />
      {[address.city, address.state, address.zip].filter(Boolean).join(', ')} <br />
      {address.countryCode}
      {address.email ? <><br />{address.email}</> : null}
    </div>
  )
}

export default function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/auth/signin?redirect=/invoice/${orderId}`)
      return
    }
    getOrder(MARKET_UNDERWORLD_STORE_ID, orderId)
      .then(setOrder)
      .catch(() => setError('This invoice could not be found, or it belongs to another account.'))
  }, [authLoading, isAuthenticated, orderId, router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] pt-32 flex flex-col items-center gap-6 text-gray-400">
        <p>{error}</p>
        <Link href="/invoices"><NexusButton variant="outline">Back to invoices</NexusButton></Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#050508] pt-32 flex justify-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading invoice" />
      </div>
    )
  }

  const paid = order.paymentStatus === 'paid'
  const currency = order.currencyCode
  const discount = Number(order.discountAmount)

  return (
    <div className="min-h-screen bg-[#050508] pt-24 pb-32 flex flex-col items-center print:bg-white print:pt-0 print:pb-0">
      <div className="w-full max-w-[800px] mb-8 px-6 flex justify-between items-center print:hidden">
        <Link href="/invoices">
          <NexusButton variant="ghost" className="text-gray-500 hover:text-white gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </NexusButton>
        </Link>
        <NexusButton variant="outline" size="sm" className="border-white/10" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
        </NexusButton>
      </div>

      <div className="w-full max-w-[800px] bg-[#FAFAFA] shadow-3xl overflow-hidden print:shadow-none print:max-w-full print:w-full">
        <div className="p-16 space-y-12">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="font-bold text-xl text-[#1A1A2E] tracking-tight uppercase">Baal Marketplace</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">
                Baalvion Industries Private Limited <br />
                CIN U43121OD2025PTC048479 • GSTIN 21AANCB3490M1ZF <br />
                Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India <br />
                support@baalvion.com • +91 89512 84770
              </div>
            </div>
            <div className="text-right space-y-2">
              <h1 className="text-5xl font-black text-[#1A1A2E] tracking-tighter uppercase italic">Invoice</h1>
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-400">{order.orderNumber}</div>
                <div className="text-xs font-bold text-[#1A1A2E]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className={`mt-4 text-white text-[10px] font-bold px-4 py-1.5 rounded-full inline-block uppercase ${paid ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                  {order.paymentStatus.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bill To</div>
              <Address address={order.billingAddress ?? order.shippingAddress} />
            </div>
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ship To</div>
              <Address address={order.shippingAddress} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E0E0E8]">
            <table className="w-full text-left">
              <thead className="bg-[#1A1A2E] text-white">
                <tr>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest">#</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest">Item</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center">Qty</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-right">Unit price</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E8] text-[#1A1A2E]">
                {order.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F5FA]'}>
                    <td className="p-4 text-xs font-bold text-gray-400">{idx + 1}</td>
                    <td className="p-4">
                      <div className="text-sm font-bold">{item.name}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">{item.sku}</div>
                    </td>
                    <td className="p-4 text-sm font-bold text-center">{item.quantity}</td>
                    <td className="p-4 text-sm font-bold text-right">{money(item.price, currency)}</td>
                    <td className="p-4 text-sm font-black text-right">{money(item.price * item.quantity, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-8">
            <div className="w-[320px] space-y-4">
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Subtotal</span><span>{money(order.subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                  <span>-{money(discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Shipping</span><span>{money(order.shippingAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Tax</span><span>{money(order.taxAmount, currency)}</span>
              </div>
              <div className="h-px bg-[#E0E0E8]" />
              <div className="flex justify-between items-end">
                <span className="text-lg font-black text-[#1A1A2E] uppercase">Total</span>
                <div className="text-3xl font-black text-[#1A1A2E] tracking-tighter">{money(order.totalAmount, currency)}</div>
              </div>
              {order.payments.length > 0 && (
                <div className="pt-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Paid via {order.payments[0].provider}
                  {order.payments[0].transactionId ? ` • ref ${order.payments[0].transactionId}` : ''}
                </div>
              )}
            </div>
          </div>

          <div className="pt-12 border-t border-[#E0E0E8] flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            <div>Baalvion Industries Private Limited</div>
            <div>community.marketunderworld.com</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          @page { size: auto; margin: 0mm; }
        }
      `}</style>
    </div>
  )
}
