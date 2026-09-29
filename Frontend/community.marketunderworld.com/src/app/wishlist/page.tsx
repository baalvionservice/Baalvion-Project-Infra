"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Loader2, Trash2, ShoppingCart } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useAuth } from "@/context/auth-context"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/hooks/use-toast"
import { getMyWishlist, removeFromWishlist } from "@/lib/api/orders"
import { getStorefrontProduct, MARKET_UNDERWORLD_STORE_ID, type StorefrontProductDetail } from "@/lib/api/commerce"

const slugifyCategory = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<StorefrontProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/auth/signin?redirect=/wishlist"); return; }
    getMyWishlist(MARKET_UNDERWORLD_STORE_ID)
      .then(async (w) => {
        const details = await Promise.all(
          w.items.map((i) => getStorefrontProduct(i.productId).catch(() => null))
        );
        setProducts(details.filter((p): p is StorefrontProductDetail => p !== null));
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(MARKET_UNDERWORLD_STORE_ID, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't remove item", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: StorefrontProductDetail) => {
    try {
      await addItem({ productId: product.id, sku: product.id, name: product.name, price: product.price });
      toast({ title: "Added to cart" });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't add to cart", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center gap-3 text-gray-500 pt-20"><Loader2 className="w-5 h-5 animate-spin" /> Loading your wishlist…</div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e5e7eb] px-6 py-12 pt-32 max-w-6xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">My Wishlist</h1>
        <p className="text-gray-500">{products.length} saved {products.length === 1 ? "item" : "items"}</p>
      </header>

      {products.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.02] space-y-4">
          <Heart className="w-10 h-10 text-gray-700 mx-auto" />
          <p className="text-gray-500">Nothing saved yet.</p>
          <Link href="/shop"><NexusButton>Browse Products</NexusButton></Link>
        </NexusCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <NexusCard key={p.id} className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group">
              <Link href={`/shop/${slugifyCategory(p.categoryName || "general")}/${p.slug}`}>
                <div className="aspect-square bg-gray-900/50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl?.[0] || "https://picsum.photos/seed/mu/300/300"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              </Link>
              <div className="p-4 space-y-3">
                <Link href={`/shop/${slugifyCategory(p.categoryName || "general")}/${p.slug}`}>
                  <p className="text-sm font-bold text-white line-clamp-2 hover:text-cyan-400 transition-colors">{p.name}</p>
                </Link>
                <p className="text-sm text-gray-400">{p.price} {p.currencyCode}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={!p.inStock}
                    className="flex-1 h-9 rounded-lg bg-cyan-500 text-black text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add
                  </button>
                  <button
                    onClick={() => handleRemove(p.id)}
                    disabled={removingId === p.id}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-red-400 flex items-center justify-center disabled:opacity-40"
                  >
                    {removingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </NexusCard>
          ))}
        </div>
      )}
    </div>
  );
}
