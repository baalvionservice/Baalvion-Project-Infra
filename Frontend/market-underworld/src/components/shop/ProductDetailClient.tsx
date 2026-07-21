"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Star, ShoppingCart, Heart } from "lucide-react"
import { NexusButton } from "@/components/ui/nexus-button"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { ProductReviews } from "@/components/shop/ProductReviews"
import { MARKET_UNDERWORLD_STORE_ID, type StorefrontProduct, type StorefrontProductDetail } from "@/lib/api/commerce"
import { getMyWishlist, addToWishlist, removeFromWishlist } from "@/lib/api/orders"

interface ProductDetailClientProps {
  product: StorefrontProductDetail;
  related: StorefrontProduct[];
  categorySlug: string;
}

export function ProductDetailClient({ product, related, categorySlug }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyWishlist(MARKET_UNDERWORLD_STORE_ID)
      .then((w) => setWishlisted(w.items.some((i) => i.productId === product.id)))
      .catch(() => {});
  }, [isAuthenticated, product.id]);

  const handleAddToCart = async () => {
    try {
      await addItem({ productId: product.id, sku: product.id, name: product.name, price: product.price });
      toast({ title: "Added to cart", description: `${product.name} is in your cart.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't add to cart", description: err instanceof Error ? err.message : "Please try again." });
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast({ variant: "destructive", title: "Sign in to save items" });
      return;
    }
    setWishlistBusy(true);
    try {
      if (wishlisted) {
        await removeFromWishlist(MARKET_UNDERWORLD_STORE_ID, product.id);
        setWishlisted(false);
      } else {
        await addToWishlist(MARKET_UNDERWORLD_STORE_ID, product.id);
        setWishlisted(true);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't update wishlist", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl?.[0] || 'https://picsum.photos/seed/mu/600/600'} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">{product.name}</h1>
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.ratingAverage) ? "text-yellow-500 fill-yellow-500" : "text-gray-700"}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.ratingCount} reviews)</span>
            </div>
          )}
          <p className="text-2xl font-bold text-white">{product.price} <span className="text-sm opacity-50">{product.currencyCode}</span></p>
          <p className="text-sm text-gray-400 leading-relaxed">{product.description}</p>
          <p className="text-xs text-gray-500">{product.inStock ? `${product.stock} in stock` : "Out of stock"}</p>
          <div className="flex gap-3">
            <NexusButton onClick={handleAddToCart} disabled={!product.inStock} className="gap-2 h-12 px-8">
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </NexusButton>
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistBusy}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors disabled:opacity-50 ${wishlisted ? "border-pink-500/40 bg-pink-500/10 text-pink-400" : "border-white/10 text-gray-500 hover:text-white"}`}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? "fill-pink-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Related Listings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} href={`/shop/${categorySlug}/${p.slug}`} className="group block rounded-xl overflow-hidden border border-white/5 bg-white/[0.02]">
                <div className="aspect-square bg-gray-900/50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl?.[0] || 'https://picsum.photos/seed/mu/300/300'} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-bold text-white line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-gray-500">{p.price} {p.currencyCode}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductReviews productId={product.id} />
    </div>
  );
}
