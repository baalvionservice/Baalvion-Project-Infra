'use strict';
const { QueryTypes } = require('sequelize');
const { CommerceMemberProfile, CommerceSellerApplication, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { randomMemberNumber, formatMemberNumber, parseMemberNumber, profilePath, profileSlug } = require('../utils/memberId');
const sellerTokenService = require('./sellerTokenService');
const buyerAccessService = require('./buyerAccessService');
const config = require('../config/appConfig');

const q = (sql, replacements) => sequelize.query(sql, { type: QueryTypes.SELECT, replacements });

async function ensureProfile(userId) {
    const existing = await CommerceMemberProfile.findByPk(userId);
    if (existing) return existing;
    for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
            return await CommerceMemberProfile.create({ userId, memberNumber: randomMemberNumber() });
        } catch (err) {
            if (!err || err.name !== 'SequelizeUniqueConstraintError') throw err;
            // Either a concurrent request just created this user's row, or the number collided: retry.
            const again = await CommerceMemberProfile.findByPk(userId);
            if (again) return again;
        }
    }
    throw new AppError('INTERNAL_SERVER_ERROR', 'Could not allocate a member number', 500);
}

// Name shown when the member hasn't chosen one: the store name for sellers, otherwise first name +
// last initial from their latest order's customer record. Never an email or a full legal name.
async function autoName(userId) {
    const app = await CommerceSellerApplication.findOne({ where: { applicantUserId: userId, status: 'approved' }, attributes: ['storeName'] });
    if (app && app.storeName) return app.storeName;
    const [c] = await q(
        `SELECT first_name AS "first", last_name AS "last" FROM orders.orders_customers WHERE user_id::text = :u ORDER BY created_at ASC LIMIT 1`,
        { u: String(userId) },
    );
    if (c && c.first) return `${c.first}${c.last ? ` ${String(c.last).charAt(0).toUpperCase()}.` : ''}`.trim();
    return null;
}

const presentName = (profile, auto) => profile.displayName || auto || `Member ${formatMemberNumber(profile.memberNumber)}`;

async function sellerStats(userId) {
    const u = String(userId);
    const [rating] = await q(
        `SELECT ROUND(AVG(r.rating)::numeric, 2)::float AS average, COUNT(*)::int AS count
           FROM commerce.commerce_product_reviews r JOIN commerce.commerce_products p ON p.id = r.product_id
          WHERE p.created_by::text = :u AND r.status = 'approved'`, { u });
    const listingRows = await q(`SELECT status, COUNT(*)::int AS n FROM commerce.commerce_products WHERE created_by::text = :u GROUP BY status`, { u });
    const listings = { draft: 0, pending_review: 0, published: 0, rejected: 0, archived: 0 };
    for (const r of listingRows) listings[r.status] = r.n;
    const categories = await q(
        `SELECT b.id, b.category_id AS "categoryId", c.name, b.status FROM commerce.commerce_seller_category_bonds b
           LEFT JOIN commerce.commerce_categories c ON c.id = b.category_id
          WHERE b.seller_user_id::text = :u AND b.kind = 'category' AND b.status IN ('awaiting_payment','payment_submitted','active') ORDER BY b.created_at`, { u });
    const orders = await q(
        `SELECT o.id, o.status, o.payment_status AS "paymentStatus", o.currency_code AS "currency", SUM(i.total)::float AS mine,
                (rt.id IS NOT NULL) AS rated
           FROM orders.orders_orders o
           JOIN orders.orders_order_items i ON i.order_id = o.id
           JOIN commerce.commerce_products p ON p.id = i.product_id
           LEFT JOIN orders.orders_buyer_ratings rt ON rt.order_id = o.id AND rt.seller_user_id::text = :u
          WHERE p.created_by::text = :u GROUP BY o.id, rt.id`, { u });
    return { rating: { average: rating ? rating.average : null, count: rating ? rating.count : 0 }, listings, categories, orders };
}

// What the seller has actually earned/handled, from their own order lines only.
function summariseSales(orders) {
    const paid = orders.filter((o) => o.paymentStatus === 'paid' && !['cancelled', 'refunded'].includes(o.status));
    const revenue = {};
    for (const o of paid) revenue[o.currency] = Math.round(((revenue[o.currency] || 0) + o.mine) * 100) / 100;
    return {
      orders: orders.length,
      paid: paid.length,
      toFulfil: paid.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
      shipped: paid.filter((o) => o.status === 'shipped').length,
      delivered: paid.filter((o) => o.status === 'delivered').length,
      toRate: paid.filter((o) => o.status === 'delivered' && !o.rated).length,
      revenue,
    };
}

// The seller's path from application to first delivered order. `next` is where to send them now.
function buildRoadmap({ application, activeCategories, listings, sales }) {
    const total = Object.values(listings).reduce((a, b) => a + b, 0);
    const steps = [
        { key: 'apply', label: 'Apply to sell', done: !!application, href: '/seller/onboarding' },
        { key: 'approved', label: 'Application approved', done: !!application && application.status === 'approved', href: '/seller/onboarding' },
        { key: 'unlock', label: 'Unlock a category ($2,000)', done: activeCategories > 0, href: '/seller/access' },
        { key: 'list', label: 'Create your first listing', done: total > 0, href: '/seller/listings' },
        { key: 'live', label: 'Get a listing approved and live', done: listings.published > 0, href: '/seller/listings' },
        { key: 'sale', label: 'Make your first sale', done: sales.paid > 0, href: '/seller/sales' },
        { key: 'delivered', label: 'Deliver your first order', done: sales.delivered > 0, href: '/seller/sales' },
    ];
    const next = steps.find((s) => !s.done) || null;
    return { steps, next, completed: steps.filter((s) => s.done).length, total: steps.length };
}

async function present(profile) {
    const auto = await autoName(profile.userId);
    const displayName = presentName(profile, auto);
    return {
        memberNumber: formatMemberNumber(profile.memberNumber),
        displayName,
        customName: !!profile.displayName,
        profilePath: profilePath(profile.memberNumber, displayName),
        memberSince: profile.createdAt,
    };
}

async function getMine(userId) {
    const profile = await ensureProfile(userId);
    const base = await present(profile);
    const application = await CommerceSellerApplication.findOne({
        where: { applicantUserId: userId }, order: [['createdAt', 'DESC']], attributes: ['id', 'status', 'storeName', 'rejectionReason'],
    });
    const isSeller = !!application && application.status === 'approved';
    if (!application) return { ...base, isSeller: false, seller: null };
    const [stats, tokens] = await Promise.all([sellerStats(userId), sellerTokenService.balanceOf(userId)]);
    const sales = summariseSales(stats.orders);
    const activeCategories = stats.categories.filter((c) => c.status === 'active').length;
    return {
        ...base,
        isSeller,
        seller: {
            application: application.toJSON(),
            tokens,
            rating: stats.rating,
            listings: stats.listings,
            categories: stats.categories,
            sales,
            roadmap: buildRoadmap({ application, activeCategories, listings: stats.listings, sales }),
        },
    };
}

async function updateMine(userId, displayName) {
    const profile = await ensureProfile(userId);
    const name = String(displayName || '').replace(/\s+/g, ' ').trim();
    if (name.length > 80) throw new AppError('VALIDATION_ERROR', 'Display name is too long', 400);
    // Blank resets to the automatic name.
    await profile.update({ displayName: name || null });
    return present(profile);
}

async function getPublic(memberNumberInput) {
    const n = parseMemberNumber(memberNumberInput);
    if (!n) throw new AppError('NOT_FOUND', 'Member not found', 404);
    const profile = await CommerceMemberProfile.findOne({ where: { memberNumber: n } });
    if (!profile) throw new AppError('NOT_FOUND', 'Member not found', 404);
    const base = await present(profile);
    const application = await CommerceSellerApplication.findOne({ where: { applicantUserId: profile.userId, status: 'approved' }, attributes: ['storeName'] });
    if (!application) return { ...base, isSeller: false, seller: null };
    const stats = await sellerStats(profile.userId);
    const sales = summariseSales(stats.orders);
    // Public view: reputation and activity only. No contact details, revenue or buyer ratings.
    return {
        ...base,
        isSeller: true,
        seller: {
            storeName: application.storeName,
            categories: stats.categories.filter((c) => c.status === 'active').map((c) => c.name).filter(Boolean),
            liveListings: stats.listings.published,
            completedSales: sales.delivered,
            rating: stats.rating,
        },
    };
}

// A seller's live listings, for their public shop page. Members only: the products are the thing the
// buyer access pass protects, so this needs the same access as /shop.
async function getListings(memberNumberInput, viewer) {
    const access = await buyerAccessService.accessFor(viewer.userId, viewer.roles);
    if (!access.hasAccess) throw new AppError('ACCESS_PASS_REQUIRED', `Browsing the marketplace needs the one-time $${config.buyerAccess.amountUsd} access pass`, 402, { priceUsd: config.buyerAccess.amountUsd });
    const n = parseMemberNumber(memberNumberInput);
    const profile = n ? await CommerceMemberProfile.findOne({ where: { memberNumber: n } }) : null;
    if (!profile) throw new AppError('NOT_FOUND', 'Member not found', 404);
    return q(
        `SELECT p.id, p.name, p.slug, c.slug AS "categorySlug",
                (SELECT v.price::float FROM commerce.commerce_product_variants v WHERE v.product_id = p.id ORDER BY v.is_default DESC, v.sort_order ASC LIMIT 1) AS price,
                (SELECT v.currency_code FROM commerce.commerce_product_variants v WHERE v.product_id = p.id ORDER BY v.is_default DESC, v.sort_order ASC LIMIT 1) AS currency,
                (SELECT m.url FROM commerce.commerce_product_media m WHERE m.product_id = p.id AND m.media_type = 'image' ORDER BY m.is_featured DESC, m.sort_order ASC LIMIT 1) AS "imageUrl"
           FROM commerce.commerce_products p
           LEFT JOIN commerce.commerce_categories c ON c.id = p.category_id
          WHERE p.created_by::text = :u AND p.store_id = :store AND p.status = 'published' AND p.visibility = 'public'
          ORDER BY p.published_at DESC NULLS LAST LIMIT 60`,
        { u: String(profile.userId), store: config.marketplace.defaultStoreId },
    );
}

module.exports = { getListings, ensureProfile, getMine, updateMine, getPublic, summariseSales, buildRoadmap, profileSlug };
