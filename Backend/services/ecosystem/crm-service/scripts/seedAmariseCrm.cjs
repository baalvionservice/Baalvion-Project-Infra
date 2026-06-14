'use strict';
/**
 * Seeds the Amarisé CRM/marketing data (brandId `amarise-luxe`) directly into the crm
 * schema via the service's own Sequelize models. Idempotent: skips a row when one with the
 * same natural key (email / name / referralCode / title) already exists for the brand.
 *
 * Migrates the storefront's former in-memory mock (Frontend/.../src/lib/mock-data.ts:
 * VIP_CLIENTS, CUSTOMER_SEGMENTS, CAMPAIGNS, VENDORS, AFFILIATES, APPOINTMENTS) into the
 * real database so the central admin-platform (:3030) becomes the single control surface.
 *
 *   NODE_PATH=../ir-service/node_modules node scripts/seedAmariseCrm.cjs
 */
const db = require('../models');

const BRAND = 'amarise-luxe';

const VIP_CLIENTS = [
    { userId: 'u-client-1', name: 'Julian Vandervilt', email: 'julian@vandervilt.com', tier: 'Diamond', loyaltyPoints: 12500, totalSpend: 250000, lastPurchase: '2024-03-10', isSubscriber: true, subscriptionPlan: 'Maison Gold', status: 'verified', walletBalance: 12500.5,
      certificates: [{ id: 'cert-11', artifactName: 'Hermès Birkin 25 Gold', provenanceScore: 100, status: 'Verified', imageUrl: 'https://picsum.photos/seed/hermes-birkin-cert/1000/1200' }] },
    { name: 'Sophia Chen', email: 'sophia@lux.net', tier: 'Gold', loyaltyPoints: 4200, totalSpend: 85000, lastPurchase: '2024-02-28', isSubscriber: false, status: 'verified', walletBalance: 500, certificates: [] },
    { name: 'Alexander Cross', email: 'a.cross@heritage.com', tier: 'Diamond', loyaltyPoints: 18000, totalSpend: 420000, lastPurchase: '2024-03-14', isSubscriber: true, subscriptionPlan: 'Atelier Reserve', status: 'verified', walletBalance: 42000, certificates: [] },
];

const SEGMENTS = [
    { name: 'Ultra-High Net Worth', description: 'Clients with >$100k lifetime spend.', userCount: 450, avgOrderValue: 12500, tags: ['Diamond', 'Bespoke'], predictedChurn: 0.05 },
    { name: 'Seasonal Enthusiasts', description: 'Purchased in last 3 months.', userCount: 2800, avgOrderValue: 3200, tags: ['Active', 'Fashion'], predictedChurn: 0.15 },
    { name: 'Dormant Connoisseurs', description: 'No purchase in 12 months.', userCount: 1200, avgOrderValue: 4500, tags: ['Inactive', 'Luxury'], predictedChurn: 0.45 },
];

const CAMPAIGNS = [
    { title: 'Midnight Soirée Flash Sale', type: 'Flash Sale', status: 'scheduled', discountValue: 15, startDate: '2024-04-01', endDate: '2024-04-03', market: 'global', reach: 45000, conversions: 1200, roi: 4.5, predictedRoi: 5.2, abTestActive: true },
    { title: 'Heritage Collection Launch', type: 'Launch', status: 'active', discountValue: 0, startDate: '2024-03-10', endDate: '2024-03-25', market: 'us', reach: 120000, conversions: 800, roi: 8.2, predictedRoi: 9.0, abTestActive: false },
    { title: 'Spring Equinox Newsletter', type: 'Email', status: 'completed', discountValue: 10, startDate: '2024-03-01', endDate: '2024-03-05', market: 'global', reach: 250000, conversions: 4500, roi: 12.4, predictedRoi: 11.5, abTestActive: true },
];

const VENDORS = [
    { name: 'Lumière Silks', category: 'Accessories', performance: 98, productCount: 45, salesTotal: 125000, status: 'active', payoutSchedule: 'weekly', joinedDate: '2023-01-10', kpis: { returnRate: 1.2, fulfillmentSpeed: '1.2 days', rating: 4.9 } },
    { name: 'Geneva Horology', category: 'Watches', performance: 95, productCount: 12, salesTotal: 850000, status: 'active', payoutSchedule: 'monthly', joinedDate: '2023-05-15', kpis: { returnRate: 0.5, fulfillmentSpeed: '2.4 days', rating: 4.8 } },
    { name: 'Artisanal Gold', category: 'Jewelry', performance: 92, productCount: 28, salesTotal: 340000, status: 'active', payoutSchedule: 'weekly', joinedDate: '2023-08-20', kpis: { returnRate: 2.1, fulfillmentSpeed: '1.8 days', rating: 4.7 } },
];

const AFFILIATES = [
    { name: 'Elena Vance', tier: 'Diamond', referralCode: 'ELENA1924', salesGenerated: 125000, commissionEarned: 12500, status: 'active' },
    { name: 'Marcus Aurelius', tier: 'Gold', referralCode: 'MARCUS', salesGenerated: 45000, commissionEarned: 4500, status: 'active' },
];

const APPOINTMENTS = [
    { customerId: 'u-client-1', customerName: 'Julian Vandervilt', type: 'Private Viewing', date: '2024-03-20', time: '14:00', city: 'London', status: 'confirmed' },
    { customerName: 'Sophia Chen', customerId: 'vip-2', type: 'Virtual Try-on', date: '2024-03-22', time: '10:30', city: 'Dubai', status: 'pending' },
];

const SUPPORT_TICKETS = [
    { customerId: 'vip-1', customerName: 'Julian Vandervilt', customerTier: 'Diamond', subject: 'Provenance inquiry regarding Heritage series', status: 'open', priority: 'urgent', category: 'Product Query', lastMessage: 'I am seeking archival documentation for the 1924 series.',
      messages: [{ id: 'm-1', sender: 'customer', text: 'I am seeking archival documentation for the 1924 series.', timestamp: '2024-03-15T10:00:00Z' }] },
    { customerId: 'vip-2', customerName: 'Sophia Chen', customerTier: 'Gold', subject: 'White-glove delivery scheduling', status: 'pending', priority: 'normal', category: 'Logistics', lastMessage: 'Could we arrange delivery for next Tuesday afternoon?',
      messages: [{ id: 'm-2', sender: 'customer', text: 'Could we arrange delivery for next Tuesday afternoon?', timestamp: '2024-03-14T09:00:00Z' }] },
];

async function ensure(Model, rows, naturalKey) {
    let created = 0, skipped = 0;
    for (const r of rows) {
        const where = { brandId: BRAND, [naturalKey]: r[naturalKey] };
        const existing = await Model.findOne({ where });
        if (existing) { skipped++; continue; }
        await Model.create({ ...r, brandId: BRAND });
        created++;
    }
    return { created, skipped };
}

async function main() {
    await db.sequelize.authenticate();
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS crm');
    await db.sequelize.sync({ alter: true });

    const out = {
        vipClients: await ensure(db.VipClient, VIP_CLIENTS, 'email'),
        segments: await ensure(db.Segment, SEGMENTS, 'name'),
        campaigns: await ensure(db.Campaign, CAMPAIGNS, 'title'),
        vendors: await ensure(db.Vendor, VENDORS, 'name'),
        affiliates: await ensure(db.Affiliate, AFFILIATES, 'referralCode'),
        appointments: await ensure(db.Appointment, APPOINTMENTS, 'customerName'),
        supportTickets: await ensure(db.SupportTicket, SUPPORT_TICKETS, 'subject'),
    };
    console.log(JSON.stringify({ ok: true, brand: BRAND, seeded: out }, null, 2));
    await db.sequelize.close();
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
