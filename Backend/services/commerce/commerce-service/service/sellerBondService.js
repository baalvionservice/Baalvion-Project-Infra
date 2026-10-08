'use strict';
const { Op } = require('sequelize');
const { CommerceSellerCategoryBond, CommerceSellerApplication, CommerceCategory, CommerceProduct, CommerceMemberProfile, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const config = require('../config/appConfig');
const paymentDestinations = require('./paymentDestinationService');

const LIVE = ['awaiting_payment', 'payment_submitted', 'active'];
const CURRENCIES = ['BTC', 'USDT', 'BINANCE'];

// A bond covers a ROOT category (e.g. "Mobiles"), so selling in any of its sub-categories
// is covered by that one deposit.
async function rootCategoryId(categoryId) {
    let current = await CommerceCategory.findByPk(categoryId, { attributes: ['id', 'parentId'] });
    if (!current) throw new AppError('NOT_FOUND', 'Category not found', 404);
    for (let hops = 0; current.parentId && hops < 10; hops += 1) {
        current = await CommerceCategory.findByPk(current.parentId, { attributes: ['id', 'parentId'] });
        if (!current) break;
    }
    return current.id;
}

async function isApprovedSeller(userId) {
    return !!(await CommerceSellerApplication.findOne({ where: { applicantUserId: userId, status: 'approved' }, attributes: ['id'] }));
}

async function createBond(authCtx, { categoryId, currency, network }) {
    if (!authCtx.userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    if (!CURRENCIES.includes(currency)) throw new AppError('VALIDATION_ERROR', `currency must be one of ${CURRENCIES.join(', ')}`, 400);
    if (!(await isApprovedSeller(authCtx.userId))) throw new AppError('FORBIDDEN', 'Your seller application must be approved first', 403);

    const rootId = await rootCategoryId(categoryId);
    const dest = await paymentDestinations.resolve(currency, network);
    if (!dest) throw new AppError('UNAVAILABLE', `${paymentDestinations.METHODS[currency].label}${network ? ` on ${network}` : ''} is not available right now`, 503);

    const existing = await CommerceSellerCategoryBond.findOne({
        where: { sellerUserId: authCtx.userId, categoryId: rootId, status: LIVE },
    });
    if (existing) throw new AppError('CONFLICT', 'You already have access to this category', 409);

    const bond = await CommerceSellerCategoryBond.create({
        sellerUserId: authCtx.userId, categoryId: rootId, amountUsd: config.sellerBond.amountUsd, currency,
        // Frozen on the payment: what the seller was told is what the admin checks against, even if the address is changed later.
        payToAddress: dest.address, payToNetwork: dest.network, payToLabel: dest.label,
    });
    return present(bond);
}

async function present(bond) {
    const json = bond.toJSON();
    if (json.status === 'awaiting_payment') {
        let address = json.payToAddress;
        let network = json.payToNetwork;
        if (!address) { // payment created before addresses were stored on it
            const dest = await paymentDestinations.resolve(json.currency, json.payToNetwork);
            address = dest ? dest.address : null;
            network = dest ? dest.network : null;
        }
        const recipient = json.payToLabel || null;
        json.payTo = {
            address, network, method: json.currency, recipient,
            label: paymentDestinations.METHODS[json.currency] ? paymentDestinations.METHODS[json.currency].label : json.currency,
            networkLabel: paymentDestinations.NETWORK_LABEL[network || ''] || null,
        };
    }
    return json;
}

async function submitPayment(authCtx, bondId, txHash) {
    const bond = await CommerceSellerCategoryBond.findByPk(bondId);
    if (!bond || String(bond.sellerUserId) !== String(authCtx.userId)) throw new AppError('NOT_FOUND', 'Payment not found', 404);
    if (bond.status !== 'awaiting_payment') throw new AppError('CONFLICT', `Payment is ${bond.status}`, 409);
    await bond.update({ status: 'payment_submitted', txHash });
    return bond.toJSON();
}

async function listMine(userId) {
    const bonds = await CommerceSellerCategoryBond.findAll({ where: { sellerUserId: userId }, order: [['createdAt', 'DESC']] });
    return Promise.all(bonds.map((b) => present(b)));
}

async function listAll(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = query.status ? { status: query.status } : {};
    const { rows, count } = await CommerceSellerCategoryBond.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    // Names for the admin screen, so a payment reads as "Seller One Mobiles → Mobiles", not two ids.
    const [cats, apps, profiles] = await Promise.all([
        CommerceCategory.findAll({ where: { id: { [Op.in]: [...new Set(rows.map((r) => r.categoryId))] } }, attributes: ['id', 'name'] }),
        CommerceSellerApplication.findAll({ where: { applicantUserId: { [Op.in]: [...new Set(rows.map((r) => r.sellerUserId))] }, status: 'approved' }, attributes: ['applicantUserId', 'storeName', 'legalFullName'] }),
        CommerceMemberProfile.findAll({ where: { userId: { [Op.in]: [...new Set(rows.map((r) => r.sellerUserId))] } }, attributes: ['userId', 'memberNumber'] }),
    ]);
    const memberNo = new Map(profiles.map((m) => [String(m.userId), m.memberNumber]));
    const catName = new Map(cats.map((c) => [c.id, c.name]));
    const seller = new Map(apps.map((a) => [String(a.applicantUserId), a]));
    const data = rows.map((r) => {
        const a = seller.get(String(r.sellerUserId));
        return { ...r.toJSON(), categoryName: catName.get(r.categoryId) || null, sellerName: a ? (a.legalFullName || a.storeName) : null, storeName: a ? a.storeName : null, memberNumber: memberNo.get(String(r.sellerUserId)) ? `HR-${memberNo.get(String(r.sellerUserId))}` : null };
    });
    return buildPaginated(data, count, { page, limit });
}

// Admin transitions. `from` is the only status each action may start from.
async function transition(bondId, from, patch) {
    const bond = await CommerceSellerCategoryBond.findByPk(bondId);
    if (!bond) throw new AppError('NOT_FOUND', 'Payment not found', 404);
    if (!from.includes(bond.status)) throw new AppError('CONFLICT', `Payment is ${bond.status}`, 409);
    await bond.update(patch);
    return bond.toJSON();
}

// Confirming a payment activates the category AND credits the seller's tokens, atomically.
async function confirmPayment(authCtx, bondId, { amountReceived, note }) {
    return sequelize.transaction(async (t) => {
        const bond = await CommerceSellerCategoryBond.findByPk(bondId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!bond) throw new AppError('NOT_FOUND', 'Payment not found', 404);
        if (bond.status !== 'payment_submitted') throw new AppError('CONFLICT', `Payment is ${bond.status}`, 409);
        await bond.update({ status: 'active', confirmedBy: authCtx.userId, confirmedAt: new Date(), amountReceived, note }, { transaction: t });
        await sequelize.query(
            `INSERT INTO commerce.commerce_seller_token_ledger (seller_user_id, delta, reason, ref_id) VALUES (:seller, :delta, 'category_payment', :ref)`,
            { replacements: { seller: bond.sellerUserId, delta: Math.round(Number(bond.amountUsd) * config.sellerBond.tokensPerUsd), ref: bond.id }, transaction: t },
        );
        return bond.toJSON();
    });
}
const rejectPayment = (authCtx, bondId, { note }) =>
    transition(bondId, ['payment_submitted'], { status: 'rejected', confirmedBy: authCtx.userId, closedAt: new Date(), note });

// Once access to a category is revoked, the seller's listings in that category must leave the storefront.
async function archiveListings(bond) {
    const ids = [bond.categoryId];
    for (let frontier = [bond.categoryId]; frontier.length && ids.length < 5000;) {
        const kids = await CommerceCategory.findAll({ where: { parentId: { [Op.in]: frontier } }, attributes: ['id'] });
        frontier = kids.map((k) => k.id);
        ids.push(...frontier);
    }
    await CommerceProduct.update(
        { status: 'archived' },
        { where: { createdBy: bond.sellerUserId, categoryId: { [Op.in]: ids }, status: { [Op.in]: ['published', 'pending_review', 'draft', 'rejected'] } } },
    );
}

async function closeBond(authCtx, bondId, from, status, note) {
    const bond = await transition(bondId, from, { status, confirmedBy: authCtx.userId, closedAt: new Date(), note });
    await archiveListings(bond);
    return bond;
}

// Revoking access (policy violation). The payment is not refunded.
const forfeitBond = (authCtx, bondId, { note }) => closeBond(authCtx, bondId, ['active'], 'forfeited', note);

/**
 * Gate used by product publishing. Only people who went through seller onboarding are bound by
 * it; catalog staff and admins who never applied as sellers are not.
 */
async function assertCanSellInCategory(userId, categoryId) {
    if (!userId || !(await isApprovedSeller(userId))) return;
    if (!categoryId) throw new AppError('VALIDATION_ERROR', 'Choose a category before submitting a listing', 400);
    const rootId = await rootCategoryId(categoryId);
    const bond = await CommerceSellerCategoryBond.findOne({
        where: { sellerUserId: userId, categoryId: rootId, status: 'active' }, attributes: ['id'],
    });
    if (!bond) {
        throw new AppError('DEPOSIT_REQUIRED', 'Category access ($' + config.sellerBond.amountUsd + ') is required to sell in this category', 402, { categoryId: rootId });
    }
}

module.exports = { createBond, submitPayment, listMine, listAll, confirmPayment, rejectPayment, forfeitBond, assertCanSellInCategory, rootCategoryId };
