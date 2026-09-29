/**
 * Cart session store — the backend (order-service) cart is CART-ID keyed
 * (POST /carts → {id}; then /carts/:cartId/items). AmariseMaison previously assumed
 * a userId-keyed cart; this module makes cartId the primary key and persists the
 * active cartId per store so every cart op uses it.
 */
import { cartApi, type Cart, type ApiResult } from './api-client';
import { getStoreId } from './store-context';

const keyFor = (storeId: string) => `amarise.cartId.${storeId}`;

export function getCartId(): string | null {
  const storeId = getStoreId();
  if (!storeId || typeof window === 'undefined') return null;
  return window.localStorage.getItem(keyFor(storeId));
}

function setCartId(storeId: string, cartId: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(keyFor(storeId), cartId);
}

export function clearCartId(): void {
  const storeId = getStoreId();
  if (storeId && typeof window !== 'undefined') window.localStorage.removeItem(keyFor(storeId));
}

/** Returns the active cartId, creating a backend cart on first use. */
export async function ensureCart(
  currencyCode = 'USD',
): Promise<{ ok: true; cartId: string } | { ok: false; error: string }> {
  const existing = getCartId();
  if (existing) return { ok: true, cartId: existing };

  const storeId = getStoreId();
  if (!storeId) return { ok: false, error: 'STORE_CONTEXT_MISSING' };

  const res = await cartApi.create({ currencyCode });
  if (!res.ok) return { ok: false, error: res.error.message };
  setCartId(storeId, res.data.id);
  return { ok: true, cartId: res.data.id };
}

/** Convenience: resolve the active cart object (creating it if needed). */
export async function loadActiveCart(): Promise<ApiResult<Cart>> {
  const ensured = await ensureCart();
  if (!ensured.ok) return { ok: false, error: { message: ensured.error, code: 400 } };
  return cartApi.get(ensured.cartId);
}
