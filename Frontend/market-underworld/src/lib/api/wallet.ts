// Real wallet-service integration (Backend/services/commerce/financial-services-java/wallet-service)
// via the wallet-proxy bridge (see api/wallet-proxy/[...path]/route.ts). Unlike giftcard-service's
// Node API, wallet-service returns raw JSON bodies (no {success,data} envelope) and raw error
// bodies shaped { code, message, ... } (see ErrorResponse.java) — so this uses its own fetch
// helper rather than reusing giftcardFetch's envelope-unwrapping logic.

const PROXY_BASE = '/api/wallet-proxy';

export type CryptoAsset = 'USDT_TRC20' | 'ETH_BEP20' | 'BTC';
export type DepositStatus = 'pending' | 'credited' | 'failed' | 'expired';

export interface WalletBalance {
    walletId: string;
    currency: string;
    available: number;
    held: number;
    total: number;
}

export interface Wallet {
    id: string;
    holderId: string;
    status: string;
    defaultCurrency: string | null;
    balances: WalletBalance[] | null;
}

export interface WalletDeposit {
    depositId: string;
    asset: CryptoAsset;
    network: string;
    address: string;
    amountValue: string;
    amountDisplay: string;
    expiresAt: string;
}

export interface WalletDepositStatus {
    depositId: string;
    status: DepositStatus;
    amount: number;
    currency: string;
    fulfillmentError: string | null;
}

function absoluteUrl(path: string): string {
    if (typeof window !== 'undefined') return path;
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return `${base}${path}`;
}

async function walletFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(absoluteUrl(`${PROXY_BASE}${path}`), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init.headers || {}) },
        credentials: 'include',
        cache: 'no-store',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(body.message || `wallet API ${path} failed: ${res.status}`);
    }
    return body as T;
}

export function usdAvailable(wallet: Wallet | null): number {
    if (!wallet || !wallet.balances) return 0;
    const usd = wallet.balances.find((b) => b.currency === 'USD');
    return usd ? usd.available : 0;
}

export async function getMyWallet(): Promise<Wallet | null> {
    try {
        return await walletFetch<Wallet>('/me');
    } catch {
        return null;
    }
}

export async function initiateDeposit(amount: number, asset: CryptoAsset): Promise<WalletDeposit> {
    return walletFetch<WalletDeposit>('/me/deposits', {
        method: 'POST',
        body: JSON.stringify({ amount, asset }),
    });
}

export async function getDepositStatus(depositId: string): Promise<WalletDepositStatus> {
    return walletFetch<WalletDepositStatus>(`/me/deposits/${depositId}`);
}
