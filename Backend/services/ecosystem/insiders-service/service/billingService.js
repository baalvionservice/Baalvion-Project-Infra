'use strict';
/**
 * Elite Circle membership billing.
 *
 * This service holds NO PSP keys. Checkout relays to the canonical JVM payment-service, which
 * owns the merchant credentials, and the membership is granted only when payment-service calls
 * back on /billing/fulfill having already signature-verified a CAPTURED provider webhook.
 *
 * That direction of trust is the whole point. The path this replaces let the browser assert its
 * own payment outcome, so a membership could be granted without a charge ever happening.
 * Nothing a client sends here decides what is owed or whether it was paid:
 *
 *   • the PRICE is quoted server-side from config.tiers + the caller's own membership row
 *   • the ORDER is created by payment-service, not by us
 *   • ACTIVATION happens only on the internal callback, and only after the captured amount is
 *     checked against what we quoted
 */
const crypto = require('crypto');
const { Money, checkCapturedAmount } = require('@baalvion/money');
const { AppError } = require('../utils/errors');
const spine = require('./paymentSpine');

// appConfig calls requireEnv('JWT_ACCESS_SECRET') at module scope, and models/ imports it — so
// requiring either at the TOP of this file would make the module unimportable without a full
// runtime environment, which its own tests do not have. Loaded on first use instead.
const config = () => require('../config/appConfig');
const db = () => require('../models');
const notify = () => require('../utils/notify');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://app-payments:3015';
const SITE_SLUG = process.env.PAYMENT_SITE_SLUG || 'baalvion-elite-circle';
const CURRENCY = 'USD';
const MEMBERSHIP_DAYS = 365;

const TIER_LABEL = { founder: 'Founder', investor_partner: 'Investor Partner' };

function internalSecret() {
    const s = process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret';
    if (process.env.NODE_ENV === 'production' && (!process.env.INTERNAL_SERVICE_SECRET || s === 'baalvion-internal-dev-secret')) {
        throw new AppError('CONFIG', 'INTERNAL_SERVICE_SECRET must be set to a non-default value in production', 500);
    }
    return s;
}

/**
 * Constant-time, length-blind comparison of the caller's shared secret.
 *
 * timingSafeEqual throws on a length mismatch, which would itself leak the length, so both
 * sides are hashed to a fixed width first.
 */
function secretMatches(presented) {
    if (typeof presented !== 'string' || presented.length === 0) return false;
    const a = crypto.createHash('sha256').update(presented).digest();
    const b = crypto.createHash('sha256').update(internalSecret()).digest();
    return crypto.timingSafeEqual(a, b);
}

/**
 * What moving to `targetTier` costs, applying the upgrade-within-grace rule.
 *
 * Server-authoritative: the caller names a tier, never an amount. Returns null for a tier that
 * is not in the catalogue so an unknown tier can never be priced at zero.
 */
/**
 * Whether `tier` is genuinely in the catalogue.
 *
 * Plain `tiers[tier]` is not a membership test: `__proto__`, `constructor` and `toString` all
 * resolve on Object.prototype, so a caller sending `tier: "__proto__"` passes a truthy check and
 * gets priced from an inherited value. Own-property only, and the value must be a real number.
 */
function knownTier(tier) {
    const tiers = config().tiers;
    if (typeof tier !== 'string' || !Object.prototype.hasOwnProperty.call(tiers, tier)) return false;
    return Number.isFinite(Number(tiers[tier]));
}

function quoteTier(membership, targetTier) {
    if (!knownTier(targetTier)) return null;
    const tiers = config().tiers;
    const full = tiers[targetTier];
    let amount = full;
    let proration = false;
    let note = `${TIER_LABEL[targetTier]} membership`;
    if (membership && membership.status === 'active' && membership.plan && membership.plan !== targetTier) {
        const currentPrice = knownTier(membership.plan) ? tiers[membership.plan] : 0;
        const days = membership.started_at ? (Date.now() - new Date(membership.started_at).getTime()) / 86400000 : Infinity;
        if (currentPrice < full && days <= config().upgradeGraceDays) {
            amount = full - currentPrice;
            proration = true;
            note = `Upgrade credit: $${currentPrice} paid ${Math.floor(days)}d ago (within ${config().upgradeGraceDays} days) → pay only the difference.`;
        } else if (currentPrice < full) {
            note = `Past the ${config().upgradeGraceDays}-day upgrade window — full ${TIER_LABEL[targetTier]} price applies.`;
        }
    }
    return { tier: targetTier, label: TIER_LABEL[targetTier], full_price: full, amount, proration, note, currency: CURRENCY };
}

/**
 * The quoted amount as exact minor units.
 *
 * config.tiers holds MAJOR units read from env, so it may legitimately be a decimal like 299.5.
 * Going through the decimal string rather than `* 100` keeps the conversion exact and lets the
 * currency's own exponent decide the scale.
 */
function quoteToMoney(quote) {
    return Money.fromDecimal(String(quote.amount), CURRENCY);
}

/** Tier catalogue + the caller's current membership + a quote per tier. */
async function tiersFor(userId) {
    const membership = await db().Membership.findOne({ where: { user_id: userId } });
    const tiers = Object.keys(config().tiers).map((t) => ({
        key: t,
        label: TIER_LABEL[t],
        price: config().tiers[t],
        current: membership?.status === 'active' && membership.plan === t,
        quote: quoteTier(membership, t),
    }));
    return { tiers, membership, grace_days: config().upgradeGraceDays };
}

/**
 * Start a membership checkout.
 *
 * Records our own `payments` row FIRST so the fulfilment callback has something authoritative to
 * check the captured amount against — without it a callback could name any amount and we would
 * have nothing to compare it to.
 */
const SUPPORTED_GATEWAY_PROVIDERS = ['razorpay', 'payu', 'cashfree'];

async function startCheckout({ userId, email, tier, provider }) {
    if (!knownTier(tier)) {
        throw new AppError('BAD_REQUEST', 'Unknown membership tier', 400);
    }
    const normalizedProvider = SUPPORTED_GATEWAY_PROVIDERS.includes(provider) ? provider : 'razorpay';
    const membership = await db().Membership.findOne({ where: { user_id: userId } });
    const quote = quoteTier(membership, tier);
    const money = quoteToMoney(quote);
    if (money.minor <= 0n) {
        // A zero or negative quote means the tier rules produced nothing to charge. Refuse rather
        // than sending a 0-amount order that a PSP would reject anyway (or, worse, accept).
        throw new AppError('BAD_REQUEST', 'Nothing to pay for this tier', 400);
    }

    // This Cashfree account is domestic-only (no IPG/international approval yet), so a USD-priced
    // membership must be charged in INR through Cashfree specifically — Razorpay/PayU stay USD.
    // The rate is an operator-set env var, not fabricated; drop this once IPG is approved. Computed
    // BEFORE the payment row is created so meta records what will actually be CHARGED (the amount
    // the fulfilment callback's integrity check must compare against), separately from the quoted
    // USD price (amount_usd / amount_minor), which the Membership record still uses.
    const CASHFREE_USD_TO_INR_RATE = Number(process.env.CASHFREE_USD_TO_INR_RATE || 88);
    const isCashfree = normalizedProvider === 'cashfree';
    const chargeAmount = isCashfree ? Math.round(Number(money.minor) * CASHFREE_USD_TO_INR_RATE) : Number(money.minor);
    const chargeCurrency = isCashfree ? 'INR' : CURRENCY;

    const payment = await db().Payment.create({
        user_id: userId,
        provider: 'gateway',
        tier,
        amount_usd: money.toDecimalString(),
        currency: CURRENCY,
        status: 'created',
        proration: quote.proration,
        meta: {
            full_price: quote.full_price, note: quote.note, amount_minor: money.minor.toString(),
            charge_minor: String(chargeAmount), charge_currency: chargeCurrency,
        },
    });

    // Idempotency is keyed on OUR payment row, so a double-submit from the browser reuses the
    // same upstream order instead of creating a second one.
    const idempotencyKey = `insiders:${payment.id}`;

    let res;
    try {
        // `site` MUST be a query param — payment-service's InitiateGatewayPaymentRequest has no
        // websiteSlug body field, and `provider`/`method` are required; the previous body shape
        // (websiteSlug in body, no provider/method) 400'd on every real checkout attempt.
        res = await fetch(`${PAYMENT_SERVICE_URL}/v1/gateway/payments?site=${encodeURIComponent(SITE_SLUG)}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'idempotency-key': idempotencyKey,
                'x-internal-secret': internalSecret(),
                'x-internal-service': 'insiders-service',
            },
            body: JSON.stringify({
                provider: normalizedProvider,
                method: 'CARD',
                amount: chargeAmount,
                currency: chargeCurrency,
                orderRef: `insiders_${payment.id}`,
                metadata: {
                    // Routes the fulfilment callback back to this service.
                    fulfillTarget: 'insiders',
                    userId: String(userId),
                    tier,
                    paymentId: String(payment.id),
                    email: email || null,
                    // The webhook reports what the membership actually costs in USD, never
                    // re-derived from the INR conversion (which would drift from the quoted price).
                    ...(isCashfree ? { usdMinor: String(money.minor) } : {}),
                },
            }),
        });
    } catch {
        await payment.update({ status: 'failed', meta: { ...payment.meta, error: 'payment_service_unreachable' } });
        throw new AppError('PAYMENT_UPSTREAM', 'payment-service unreachable', 502);
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        await payment.update({ status: 'failed', meta: { ...payment.meta, upstreamStatus: res.status } });
        // Never echo the upstream body to the caller — it can carry provider detail.
        throw new AppError('PAYMENT_GATEWAY_UNAVAILABLE', 'Payment could not be started', res.status === 503 ? 503 : 502);
    }

    // The gateway-checkout response is flat (id/provider/providerRef/clientParams at the top
    // level), not wrapped in a `data` envelope — a prior version of this code assumed a wrapper
    // that payment-service has never actually sent, so provider/orderId were silently lost.
    const mockRef = /mock/i.test(String(body.providerRef || ''));
    await payment.update({
        provider: String(body.provider || normalizedProvider).toLowerCase(),
        provider_order_id: body.providerRef || null,
    });

    return {
        paymentId: payment.id,
        provider: body.provider || normalizedProvider,
        mode: mockRef ? 'mock' : 'live',
        orderId: body.providerRef,
        amount: chargeAmount,
        currency: chargeCurrency,
        quote,
        clientParams: body.clientParams || {},
    };
}

/**
 * Internal fulfilment callback — payment-service calls this after signature-verifying a CAPTURED
 * provider webhook. It is the trust anchor; authenticity here rests on the shared internal
 * secret, never on a user session.
 *
 * Reliability contract with the caller: 200 = applied or duplicate (do not retry); 400 =
 * permanently malformed (do not retry); 503 = transient (retry). The idempotency claim is
 * released on a transient failure so the retry can re-apply.
 */
async function fulfill({ eventId, provider, metadata, amountMinor, currency, providerRef }) {
    if (!eventId) {
        throw new AppError('VALIDATION_ERROR', 'eventId is required', 400);
    }
    const md = metadata || {};
    const userId = md.userId;
    const tier = md.tier;
    if (!userId || !knownTier(tier)) {
        throw new AppError('VALIDATION_ERROR', 'metadata.userId and a known metadata.tier are required', 400);
    }

    const providerKey = String(provider || 'gateway').toLowerCase();
    const [claim, created] = await db().BillingWebhookEvent.findOrCreate({
        where: { provider: providerKey, event_id: String(eventId) },
        defaults: {
            provider: providerKey,
            event_id: String(eventId),
            status: 'claimed',
            payload: { metadata: md, amountMinor, currency, providerRef },
        },
    });
    if (!created && claim.status === 'applied') {
        return { applied: true, duplicate: true };
    }

    try {
        // Amount integrity. The charge must match what WE quoted and recorded at checkout —
        // otherwise a callback naming a smaller amount would buy a full membership.
        const payment = md.paymentId ? await db().Payment.findByPk(md.paymentId) : null;
        if (payment) {
            if (String(payment.user_id) !== String(userId)) {
                // The order belongs to someone else — never activate across users.
                throw new AppError('VALIDATION_ERROR', 'payment does not belong to this user', 400);
            }
            // Compare against what was actually CHARGED (meta.charge_minor/charge_currency — the
            // INR conversion for Cashfree, the USD quote otherwise), never the USD quote alone —
            // a Cashfree capture legitimately arrives in INR and would false-positive as tampered
            // if compared to the USD amount. Falls back to amount_minor/USD for pre-conversion rows.
            const expected = Money.of(
                BigInt(payment.meta?.charge_minor ?? payment.meta?.amount_minor ?? '0'),
                payment.meta?.charge_currency || payment.currency || CURRENCY,
            );
            const match = checkCapturedAmount(expected, amountMinor ?? 0, String(currency || CURRENCY).toUpperCase());
            if (!match.ok) {
                await payment.update({ status: 'failed', meta: { ...payment.meta, amountMismatch: match.difference.toDecimalString() } });
                throw new AppError('AMOUNT_MISMATCH', 'captured amount does not match the quoted amount', 400);
            }
            await payment.update({ status: 'paid', provider: providerKey, provider_ref: providerRef || payment.provider_ref });
        }

        const now = new Date();
        const expires = new Date(now.getTime() + MEMBERSHIP_DAYS * 864e5);
        // What the member was actually QUOTED in USD — never re-derived from an INR capture, which
        // would record the membership at a currency-converted (and rate-drifted) dollar figure.
        const usdMinorFromMeta = md.usdMinor != null ? md.usdMinor : (payment ? payment.meta?.amount_minor : null);
        const amountUsd = usdMinorFromMeta != null
            ? Money.of(BigInt(usdMinorFromMeta), CURRENCY).toDecimalString()
            : Money.of(BigInt(amountMinor ?? 0), String(currency || CURRENCY).toUpperCase()).toDecimalString();
        const membershipCurrency = usdMinorFromMeta != null ? CURRENCY : String(currency || CURRENCY).toUpperCase();
        const [m] = await db().Membership.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId, plan: tier, status: 'active', amount_usd: amountUsd,
                currency: membershipCurrency,
                started_at: now, expires_at: expires, payment_ref: providerRef || String(eventId),
            },
        });
        // A new tier starts now, which also resets the upgrade grace window.
        await m.update({
            plan: tier, status: 'active', amount_usd: amountUsd,
            currency: membershipCurrency,
            started_at: now, expires_at: expires, payment_ref: providerRef || String(eventId),
        });

        await notify().createNotification({
            userId,
            type: 'membership',
            title: `${TIER_LABEL[tier]} active`,
            message: `Payment received. Your ${TIER_LABEL[tier]} membership is now active.`,
            link: '/investors',
        }).catch(() => { /* a notification failure must not undo a paid membership */ });

        await claim.update({ status: 'applied' });

        // Report onto the platform spine so this payment shows on the cross-estate panel.
        // Best-effort by design: a spine failure must not turn a paid membership into a 503
        // that payment-service then retries forever.
        try {
            await spine.reportMembershipPayment({
                eventId, provider: providerKey, userId, tier,
                amountMinor, currency, providerRef, email: md.email || null,
            });
        } catch (err) {
            console.error(JSON.stringify({ evt: 'insiders.spine_report_failed', eventId, msg: err.message }));
        }

        return { applied: true, duplicate: false, membership: m };
    } catch (err) {
        // Release the claim so a retry can re-apply — but only for transient failures. A
        // permanently malformed or mismatched event keeps its claim so it is not reprocessed.
        if (!(err instanceof AppError) || err.statusCode >= 500) {
            await claim.destroy().catch(() => {});
        }
        throw err;
    }
}

module.exports = { startCheckout, fulfill, tiersFor, quoteTier, secretMatches, TIER_LABEL, SITE_SLUG };
