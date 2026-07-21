'use strict';
// PayU return / webhook. After the shopper pays on PayU's hosted page, PayU form-POSTs the result
// here (application/x-www-form-urlencoded). We verify the SHA-512 REVERSE hash (the provider's auth —
// this is NOT user-authenticated) before settling the order, then 302-redirect the shopper's browser
// back to the storefront confirmation. Mounted OUTSIDE the /stores/:storeId tree — the order's store
// is resolved server-side from the txnid. Settlement is idempotent + order-row locked (see
// orderService.settlePayuReturn → capturePaymentFromWebhook), mutually-exclusive with any confirm.
const express = require('express');
const { Router } = require('express');
const orderService = require('../service/orderService');

const router = Router();
const STOREFRONT = (process.env.STOREFRONT_URL || process.env.APP_URL || 'http://localhost:3033').replace(/\/+$/, '');

// SSRF/open-redirect guard: only ever bounce to an http(s) URL — a malformed or malicious
// order.metadata.returnUrl (whatever an unrelated code path may have set) can never redirect
// the shopper's browser somewhere unexpected.
function safeReturnUrl(candidate) {
  if (!candidate) return null;
  try {
    const u = new URL(candidate);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.origin + u.pathname : null;
  } catch { return null; }
}

// Per-order returnUrl (the tenant that actually placed the order, see orderService.createPaymentIntent)
// wins when present; falls back to the single global STOREFRONT_URL/APP_URL default otherwise —
// preserves existing behavior for any caller that never sent a returnUrl.
const bounce = (res, { market, returnUrl }, query) => {
  const base = safeReturnUrl(returnUrl) || `${STOREFRONT}/${market || 'us'}/checkout`;
  return res.redirect(303, `${base}?${query}`);
};

// PayU posts form-urlencoded (the global JSON parser would leave req.body empty), so parse it here.
router.post('/', express.urlencoded({ extended: false, limit: '1mb' }), async (req, res, next) => {
  try {
    const result = await orderService.settlePayuReturn(req.body || {});
    if (!result.ok) {
      // Bad signature / unknown order → generic failure bounce (never leak which order).
      return bounce(res, {}, 'payu=failed');
    }
    const flag = result.settled === 'paid' ? 'success' : 'failed';
    return bounce(res, result, `order=${encodeURIComponent(result.orderId)}&payu=${flag}`);
  } catch (err) { return next(err); }
});

// PayU may also GET the cancel URL in some configs — treat as a failed bounce. No txnid to
// resolve an order from here, so this always uses the global default.
router.get('/', (req, res) => bounce(res, {}, 'payu=cancelled'));

module.exports = router;
