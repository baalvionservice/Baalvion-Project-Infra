const STORAGE_KEY = "imperialpedia:voter-token";

/** Anonymous per-browser id for dedup'ing votes (feedback, polls) — no account
 *  needed. Generated once and persisted; safe to call from any client component. */
export function getVoterToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const token = window.crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    return "";
  }
}
