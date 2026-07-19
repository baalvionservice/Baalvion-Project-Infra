// Real giftcard-service integration — replaces the mock region-based marketplace
// (src/data/mockData.ts's REGIONS) entirely for /marketplace. Same proxy-bridge pattern as
// lib/api/community.ts (see api/giftcard-proxy/[...path]/route.ts).

const PROXY_BASE = '/api/giftcard-proxy';

export type CryptoAsset = 'USDT_TRC20' | 'ETH_BEP20' | 'BTC';
export type OrderStatus = 'pending_payment' | 'paid' | 'fulfilling' | 'fulfilled' | 'failed' | 'refunded';

export interface GiftCardBrand {
    slug: string;
    name: string;
    countryCode: string;
    currencyCode: string;
    denominationType: 'FIXED' | 'RANGE';
    fixedDenominations: number[];
    minDenomination: number | null;
    maxDenomination: number | null;
    logoUrl: string | null;
    description: string | null;
}

export interface GiftCardCheckout {
    orderId: string;
    asset: CryptoAsset;
    network: string;
    address: string;
    amountValue: string;
    amountDisplay: string;
    expiresAt: string;
}

export interface GiftCardOrder {
    id: string;
    brandName: string;
    brandLogoUrl: string | null;
    denominationValue: number;
    currencyCode: string;
    status: OrderStatus;
    fulfillmentError?: string;
    redeemCode: string | null;
    redeemPin: string | null;
    createdAt: string;
    fulfilledAt: string | null;
}

interface ApiEnvelope<T> {
    success: boolean;
    data: T;
    error?: { code: string; message: string };
}

function absoluteUrl(path: string): string {
    if (typeof window !== 'undefined') return path;
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return `${base}${path}`;
}

async function giftcardFetch<T>(path: string, init: RequestInit = {}, revalidate?: number): Promise<T> {
    const res = await fetch(absoluteUrl(`${PROXY_BASE}${path}`), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init.headers || {}) },
        credentials: 'include',
        ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' }),
    });
    const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
    if (!res.ok || body.success === false) {
        throw new Error(body.error?.message || `giftcard API ${path} failed: ${res.status}`);
    }
    return body.data;
}

export async function getCatalog(countryCode?: string): Promise<GiftCardBrand[]> {
    try {
        const qs = countryCode ? `?country=${encodeURIComponent(countryCode)}` : '';
        return await giftcardFetch<GiftCardBrand[]>(`/catalog${qs}`, {}, 60);
    } catch {
        return [];
    }
}

export async function checkoutGiftCard(brandSlug: string, denomination: number, asset: CryptoAsset): Promise<GiftCardCheckout> {
    return giftcardFetch<GiftCardCheckout>(`/brands/${brandSlug}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ denomination, asset }),
    });
}

export async function getMyOrders(): Promise<GiftCardOrder[]> {
    try {
        return await giftcardFetch<GiftCardOrder[]>('/my-orders');
    } catch {
        return [];
    }
}

export async function getMyOrder(orderId: string): Promise<GiftCardOrder | null> {
    const orders = await getMyOrders();
    return orders.find((o) => o.id === orderId) ?? null;
}

// Admin / merchant views — platform-admin only, enforced server-side by giftcard-service's
// requirePlatformAdmin (a non-admin caller gets a real 403 from the proxy, not a client gate).

export interface AdminGiftCardOrder {
    id: string;
    userId: string;
    brandName: string | null;
    brandLogoUrl: string | null;
    supplier: string;
    denominationValue: number;
    currencyCode: string;
    priceUsdCents: number;
    status: OrderStatus;
    fulfillmentError?: string;
    createdAt: string;
    fulfilledAt: string | null;
}

export interface AdminOrdersPage {
    total: number;
    orders: AdminGiftCardOrder[];
}

export interface MerchantStats {
    totalOrders: number;
    fulfilledOrders: number;
    pendingOrders: number;
    failedOrders: number;
    revenueUsdCents: number;
    totalBrands: number;
    activeBrands: number;
}

export interface AdminGiftCardBrand extends GiftCardBrand {
    supplier: string;
    isActive: boolean;
    lastSyncedAt: string | null;
}

export async function getMerchantStats(): Promise<MerchantStats | null> {
    try {
        return await giftcardFetch<MerchantStats>('/admin/stats');
    } catch {
        return null;
    }
}

export async function getAdminOrders(status?: OrderStatus): Promise<AdminOrdersPage> {
    try {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        return await giftcardFetch<AdminOrdersPage>(`/admin/orders${qs}`);
    } catch {
        return { total: 0, orders: [] };
    }
}

export async function getAdminCatalog(): Promise<AdminGiftCardBrand[]> {
    try {
        return await giftcardFetch<AdminGiftCardBrand[]>('/admin/catalog');
    } catch {
        return [];
    }
}

export async function syncCatalog(supplier = 'reloadly'): Promise<{ synced: unknown }> {
    return giftcardFetch<{ synced: unknown }>('/admin/catalog/sync', {
        method: 'POST',
        body: JSON.stringify({ supplier }),
    });
}
