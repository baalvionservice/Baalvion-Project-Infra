// The server answers 402 ACCESS_PASS_REQUIRED when someone who is signed in but holds no access pass tries to post,
// book or apply. Every API helper reports it here so one prompt (components/access/pass-prompt.tsx) can open,
// whichever form the person was on.
export const PASS_REQUIRED_EVENT = 'mu:pass-required';

export function notifyPassRequired(error: { code?: string; details?: { priceUsd?: number } } | undefined) {
  if (typeof window === 'undefined' || error?.code !== 'ACCESS_PASS_REQUIRED') return;
  window.dispatchEvent(new CustomEvent(PASS_REQUIRED_EVENT, { detail: { priceUsd: error.details?.priceUsd } }));
}
