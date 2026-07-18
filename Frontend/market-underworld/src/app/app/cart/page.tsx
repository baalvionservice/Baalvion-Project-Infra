"use client"

import Link from "next/link"
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/hooks/use-toast"

export default function CartPage() {
  const { cart, isLoading, updateItemQuantity, removeItem, clear } = useCart();
  const { toast } = useToast();

  const changeQuantity = async (item: { productId: string | null; variantId: string | null }, quantity: number) => {
    try {
      await updateItemQuantity({ productId: item.productId, variantId: item.variantId }, quantity);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't update quantity", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

  const remove = async (item: { productId: string | null; variantId: string | null }) => {
    try {
      await removeItem({ productId: item.productId, variantId: item.variantId });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't remove item", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

  if (isLoading) {
    return <div className="p-10 text-gray-500 font-medium">Loading your cart…</div>;
  }

  const items = cart?.items ?? [];

  return (
    <div className="px-6 pt-8 pb-32 max-w-2xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Link href="/app/shop" className="p-2 rounded-xl bg-white/5 border border-white/10">
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">Your Cart</h1>
      </header>

      {items.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <ShoppingCart className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-6">Your cart is empty.</p>
          <Link href="/app/shop">
            <NexusButton size="sm">Browse the shop</NexusButton>
          </Link>
        </NexusCard>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <NexusCard key={`${item.productId ?? item.sku}-${item.variantId ?? idx}`} className="p-4 border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.price} {cart?.currencyCode} each</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 px-2 py-1">
                      <button onClick={() => changeQuantity(item, item.quantity - 1)} className="p-1 text-gray-400 hover:text-white">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                      <button onClick={() => changeQuantity(item, item.quantity + 1)} className="p-1 text-gray-400 hover:text-white">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => remove(item)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </NexusCard>
            ))}
          </div>

          <NexusCard className="p-6 border-white/5 bg-white/[0.02] space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span className="font-bold text-white">{cart?.subtotal} {cart?.currencyCode}</span>
            </div>
            {Number(cart?.discountAmount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-400">
                <span>Discount</span>
                <span className="font-bold">-{cart?.discountAmount} {cart?.currencyCode}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-lg pt-4 border-t border-white/10">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-white">{cart?.totalAmount} {cart?.currencyCode}</span>
            </div>
            <NexusButton
              className="w-full h-12"
              onClick={() => toast({ title: "Checkout coming soon", description: "Your cart is saved — checkout isn't wired up yet." })}
            >
              Checkout
            </NexusButton>
            <button onClick={() => clear()} className="w-full text-center text-xs text-gray-600 hover:text-gray-400 font-bold uppercase tracking-widest">
              Clear cart
            </button>
          </NexusCard>
        </>
      )}
    </div>
  )
}
