'use strict';
// PayPal return + webhook. After approving on PayPal the shopper's browser GETs /return?token=<order>;
// we capture server-side (never trusting the browser), verify amount, then 303 back to the storefront.
// /webhook is PayPal's own async notification, verified through PayPal's verify-webhook-signature API.
// Neither is user-authenticated; the order's store is resolved server-side from the PayPal order id.
const { Router } = require('express');
const orderService = require('../service/orderService');
const paypal = require('../service/paypal');

const router = Router();
const STOREFRONT = (process.env.STOREFRONT_URL || process.env.APP_URL || 'http://localhost:3033').replace(/\/+$/, '');

// Only ever bounce to http(s); a bad order.metadata.returnUrl can't send the shopper elsewhere.
function safeReturnUrl(candidate) {
  if (!candidate) return null;
  try {
    const u = new URL(candidate);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.origin + u.pathname : null;
  } catch { return null; }
}
const bounce = (res, { market, returnUrl }, query) => {
  const base = safeReturnUrl(returnUrl) || `${STOREFRONT}/${market || 'us'}/checkout`;
  return res.redirect(303, `${base}?${query}`);
};

router.get('/return', async (req, res, next) => {
  try {
    const result = await orderService.settlePaypalReturn(String(req.query.token || ''));
    if (!result.ok) return bounce(res, {}, 'paypal=failed');
    return bounce(res, result, `order=${encodeURIComponent(result.orderId)}&paypal=${result.settled === 'paid' ? 'success' : result.settled}`);
  } catch (err) { return next(err); }
});

router.get('/cancel', (req, res) => bounce(res, {}, 'paypal=cancelled'));

router.post('/', async (req, res, next) => {
  try {
    const event = req.body || {};
    if (!(await paypal.verifyWebhook({ headers: req.headers, event }))) {
      return res.status(400).json({ error: 'invalid webhook signature' });
    }
    await orderService.handlePaypalWebhook(event);
    return res.status(200).json({ received: true });
  } catch (err) { return next(err); }
});

module.exports = router;
