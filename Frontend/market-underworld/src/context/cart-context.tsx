"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { MARKET_UNDERWORLD_STORE_ID } from '@/lib/api/commerce';
import * as cartApi from '@/lib/api/cart';
import { useAuth } from './auth-context';

const CART_ID_KEY = 'mu_cart_id';

interface CartContextType {
  cart: cartApi.Cart | null;
  isLoading: boolean;
  itemCount: number;
  addItem: (item: { sku: string; name: string; price: number; quantity?: number; productId?: string | null; variantId?: string | null }) => Promise<void>;
  updateItemQuantity: (key: { variantId?: string | null; productId?: string | null }, quantity: number) => Promise<void>;
  removeItem: (key: { variantId?: string | null; productId?: string | null }) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<cartApi.Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const claimedRef = useRef(false);

  const ensureCart = useCallback(async (): Promise<cartApi.Cart> => {
    const storedId = typeof window !== 'undefined' ? window.localStorage.getItem(CART_ID_KEY) : null;
    if (storedId) {
      try {
        const existing = await cartApi.getCart(MARKET_UNDERWORLD_STORE_ID, storedId);
        setCart(existing);
        return existing;
      } catch {
        // Expired, deleted, or the guest session no longer verifies — fall through and start fresh.
      }
    }
    const created = await cartApi.createCart(MARKET_UNDERWORLD_STORE_ID);
    if (typeof window !== 'undefined') window.localStorage.setItem(CART_ID_KEY, created.id);
    setCart(created);
    return created;
  }, []);

  useEffect(() => {
    setIsLoading(true);
    ensureCart().finally(() => setIsLoading(false));
  }, [ensureCart]);

  // Claim-on-login: once authenticated, adopt the guest cart so it survives past this session
  // (order-service's claimCart proves ownership via the signed X-Cart-Session, no bypass).
  useEffect(() => {
    if (!isAuthenticated || !cart || cart.userId != null || claimedRef.current) return;
    claimedRef.current = true;
    cartApi.claimCart(MARKET_UNDERWORLD_STORE_ID, cart.id).then(setCart).catch(() => { claimedRef.current = false; });
  }, [isAuthenticated, cart]);

  const addItem: CartContextType['addItem'] = useCallback(async (item) => {
    const active = cart ?? await ensureCart();
    const updated = await cartApi.addCartItem(MARKET_UNDERWORLD_STORE_ID, active.id, {
      productId: item.productId ?? null,
      variantId: item.variantId ?? null,
      sku: item.sku,
      name: item.name,
      price: item.price,
      quantity: item.quantity ?? 1,
    });
    setCart(updated);
  }, [cart, ensureCart]);

  const updateItemQuantity: CartContextType['updateItemQuantity'] = useCallback(async (key, quantity) => {
    if (!cart) return;
    const updated = await cartApi.updateCartItem(MARKET_UNDERWORLD_STORE_ID, cart.id, key, quantity);
    setCart(updated);
  }, [cart]);

  const removeItem: CartContextType['removeItem'] = useCallback(async (key) => {
    if (!cart) return;
    await cartApi.removeCartItem(MARKET_UNDERWORLD_STORE_ID, cart.id, key);
    const refreshed = await cartApi.getCart(MARKET_UNDERWORLD_STORE_ID, cart.id);
    setCart(refreshed);
  }, [cart]);

  const clear = useCallback(async () => {
    if (!cart) return;
    await cartApi.clearCart(MARKET_UNDERWORLD_STORE_ID, cart.id);
    const refreshed = await cartApi.getCart(MARKET_UNDERWORLD_STORE_ID, cart.id);
    setCart(refreshed);
  }, [cart]);

  const itemCount = (cart?.items ?? []).reduce((n, i) => n + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, isLoading, itemCount, addItem, updateItemQuantity, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
