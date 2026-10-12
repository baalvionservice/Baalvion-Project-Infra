// The 7-day identity check window. The server decides; this only asks and remembers for a short while.
export type KycState = "exempt" | "verified" | "under_review" | "blocked" | "open";
export interface KycWindow { state: KycState; daysLeft: number | null }

let cached: { at: number; value: KycWindow } | null = null;

export function clearKycWindow() { cached = null; }

export async function loadKycWindow(force = false): Promise<KycWindow | null> {
  if (!force && cached && Date.now() - cached.at < 60_000) return cached.value;
  try {
    const res = await fetch("/api/community-proxy/me/kyc-status", { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    const value = (body.data ?? body) as KycWindow;
    cached = { at: Date.now(), value };
    return value;
  } catch { return null; }
}
