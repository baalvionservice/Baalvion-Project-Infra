'use strict';
/**
 * DEV / trader-wedge PAYMENT SIMULATOR.
 *
 * Stands in for the finance suite while settlement "rides existing rails": when an order
 * emits its payment intent (gtos.order.payment_requested.v1), this publishes a terminal
 * `payments.transaction.completed` back onto the bus, which the order eventConsumer cascades
 * into the saga (placed → payment_confirmed). This closes the buyer→order→paid loop without
 * the full Java payment/escrow rails.
 *
 * Env-gated by PAYMENT_SIMULATOR. In production the real payment-service emits
 * payments.transaction.* over the same bus and this MUST stay OFF (config defaults it off).
 * Uses its OWN consumer group so it never competes with the saga consumer for events.
 */
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');

let _subscription = null;
const SIM_GROUP = `${config.eventBus.consumerGroup}-payment-sim`;
const PAYMENT_REQUESTED = 'gtos.order.payment_requested.v1';

async function handle(event) {
    if (event.eventType !== PAYMENT_REQUESTED) return; // subscribed to gtos.order.> — filter
    const sdk = getSdk();
    const p = event.payload || {};
    const orderId = p.orderId || p.order_id;
    if (!orderId) return;
    await sdk.trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, async () => {
        await sdk.events.publish('payments.transaction.completed', {
            orderId,
            amount: p.amount,
            currency: p.currency,
            baseCurrencyAmount: p.baseCurrencyAmount,
            baseCurrency: p.baseCurrency,
            fxRateUsed: p.fxRateUsed,
            provider: 'simulator',
            simulated: true,
        }, { tenantId: event.tenantId });
        sdk.logger.info({ orderId, simulated: true }, 'payment simulated → payments.transaction.completed');
    });
}

async function startPaymentSimulator() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('gtos.order.>', SIM_GROUP, handle);
    sdk.logger.info({ group: SIM_GROUP }, 'payment simulator started (DEV: settlement rides simulated rails)');
    return _subscription;
}
async function stopPaymentSimulator() { if (_subscription) { await _subscription.unsubscribe(); _subscription = null; } }

module.exports = { startPaymentSimulator, stopPaymentSimulator, handle };
