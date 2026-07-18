'use strict';

/**
 * Pluggable gift-card supplier registry — mirrors payment-service's PaymentGateway SPI
 * (one interface, swappable provider adapters). Every adapter implements:
 *   - isConfigured(): boolean
 *   - listProducts(countryCode): Promise<NormalizedProduct[]>
 *   - createOrder({ productId, denomination, customIdentifier, recipientEmail }): Promise<{ transactionId }>
 *   - fetchRedeemCode(transactionId): Promise<{ code, pin? }>
 *
 * Reloadly is the only adapter backed by a real, verified API contract today. The other nine
 * (GoGift Global, Blackhawk Network, InComm Payments, Prezzee Business, Giftbit, Tillo, Runa,
 * GiftM, Ncentiva) are enterprise B2B services with no self-serve sandbox — integrating them
 * for real requires a signed account with each and their actual API reference, which this
 * environment does not have access to. Rather than fabricate an integration against an
 * unverified contract (indistinguishable from mock code pretending to be real), each is
 * registered as a real slot that throws SUPPLIER_NOT_CONFIGURED until wired with a verified
 * adapter — never a fake success.
 */

const config = require('../../config/appConfig');
const { AppError } = require('../../utils/errors');
const { ReloadlyClient } = require('./reloadlyClient');

const reloadlyClient = new ReloadlyClient(config.reloadly);

function normalizeReloadlyProduct(p) {
    return {
        supplier: 'reloadly',
        supplierProductId: String(p.productId),
        name: p.productName,
        countryCode: p.country && p.country.isoName,
        currencyCode: p.recipientCurrencyCode,
        denominationType: p.denominationType, // 'FIXED' | 'RANGE'
        fixedDenominations: p.fixedRecipientDenominations || [],
        minDenomination: p.minRecipientDenomination || null,
        maxDenomination: p.maxRecipientDenomination || null,
        logoUrl: p.logoUrls && p.logoUrls[0],
        redeemInstruction: p.redeemInstruction && p.redeemInstruction.concise,
    };
}

const reloadlyAdapter = {
    key: 'reloadly',
    displayName: 'Reloadly',
    isConfigured: () => reloadlyClient.isConfigured(),
    async listProducts(countryCode) {
        const raw = countryCode
            ? await reloadlyClient.listProductsByCountry(countryCode)
            : await reloadlyClient.listProducts();
        const items = Array.isArray(raw) ? raw : (raw.content || []);
        return items.map(normalizeReloadlyProduct);
    },
    async createOrder({ productId, denomination, customIdentifier, recipientEmail }) {
        const order = await reloadlyClient.createOrder({
            productId: Number(productId),
            unitPrice: denomination,
            customIdentifier,
            recipientEmail,
        });
        return { transactionId: String(order.transactionId) };
    },
    async fetchRedeemCode(transactionId) {
        const result = await reloadlyClient.fetchRedeemCode(transactionId);
        const cards = Array.isArray(result) ? result : (result.cards || [result]);
        const first = cards[0] || {};
        return { code: first.cardNumber || first.pinCode || null, pin: first.pinCode || null };
    },
};

function notConfiguredAdapter(key, displayName) {
    return {
        key,
        displayName,
        isConfigured: () => false,
        async listProducts() { return []; },
        async createOrder() {
            throw new AppError('SUPPLIER_NOT_CONFIGURED', `${displayName} is not yet integrated — no verified API contract or account credentials configured.`, 503);
        },
        async fetchRedeemCode() {
            throw new AppError('SUPPLIER_NOT_CONFIGURED', `${displayName} is not yet integrated.`, 503);
        },
    };
}

const REGISTRY = {
    reloadly: reloadlyAdapter,
    gogift: notConfiguredAdapter('gogift', 'GoGift Global'),
    blackhawk: notConfiguredAdapter('blackhawk', 'Blackhawk Network'),
    incomm: notConfiguredAdapter('incomm', 'InComm Payments'),
    prezzee: notConfiguredAdapter('prezzee', 'Prezzee Business'),
    giftbit: notConfiguredAdapter('giftbit', 'Giftbit'),
    tillo: notConfiguredAdapter('tillo', 'Tillo'),
    runa: notConfiguredAdapter('runa', 'Runa'),
    giftm: notConfiguredAdapter('giftm', 'GiftM'),
    ncentiva: notConfiguredAdapter('ncentiva', 'Ncentiva'),
};

function getSupplier(key) {
    const adapter = REGISTRY[key];
    if (!adapter) throw new AppError('UNKNOWN_SUPPLIER', `Unknown supplier: ${key}`, 400);
    return adapter;
}

function listSuppliers() {
    return Object.values(REGISTRY).map((a) => ({ key: a.key, displayName: a.displayName, configured: a.isConfigured() }));
}

module.exports = { getSupplier, listSuppliers, REGISTRY };
