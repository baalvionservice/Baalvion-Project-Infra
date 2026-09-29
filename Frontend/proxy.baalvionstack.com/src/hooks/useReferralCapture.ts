import { useEffect } from "react";
import { referralApi } from "@/lib/platformClient";

/**
 * Captures an affiliate referral on app load: if the URL carries `?ref=CODE`,
 * it persists the code (so attribution survives the signup flow) and pings the
 * public `/v1/referral/track` endpoint with a stable anonymous visitor id.
 * Mounted once at the app root. Best-effort — never blocks rendering.
 */
const REF_KEY = "baalvion_ref_code";
const VISITOR_KEY = "baalvion_visitor_id";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() ?? `v_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function useReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("ref") || params.get("aff") || params.get("via");
      if (!code) return;
      // Persist for the signup flow (read on registration to attach the referral).
      localStorage.setItem(REF_KEY, code);
      // Fire-and-forget click tracking.
      referralApi.track(code, getVisitorId()).catch(() => { /* best-effort */ });
    } catch { /* SSR / no-window guard */ }
  }, []);
}

/** Read the stored referral code (e.g. to send with a signup request). */
export function getStoredReferral(): string | null {
  try { return localStorage.getItem(REF_KEY); } catch { return null; }
}
