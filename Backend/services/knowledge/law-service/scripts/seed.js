'use strict';
/**
 * Demo data seeder for the `legal` schema (Law Elite Network).
 * Idempotent: unique-keyed rows use findOrCreate; volume tables only seed when empty.
 *
 *   JWT_PUBLIC_KEY=<key> node scripts/seed.js     (key optional — placeholder injected for import)
 */
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'seed-placeholder-not-used';
const db = require('../models');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'infra.baalvion@gmail.com';

async function seed() {
    await db.sequelize.authenticate();
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS legal');
    await db.sequelize.sync({ alter: false });

    // ── Users (mirror of canonical identities, reconciled by email) ───────────
    const [admin] = await db.User.findOrCreate({ where: { email: ADMIN_EMAIL }, defaults: { email: ADMIN_EMAIL, password_hash: 'external-auth', full_name: 'Platform Admin', role: 'admin' } });
    const lawyerUsers = [];
    for (const u of [
        { email: 'amelia.stone@lawelite.test', full_name: 'Amelia Stone' },
        { email: 'raj.patel@lawelite.test', full_name: 'Raj Patel' },
        { email: 'sofia.moreno@lawelite.test', full_name: 'Sofia Moreno' },
        { email: 'noah.kim@lawelite.test', full_name: 'Noah Kim' },
        { email: 'oliver.bennett@lawelite.test', full_name: 'Oliver Bennett' },
        { email: 'priya.nair@lawelite.test', full_name: 'Priya Nair' },
        { email: 'khalid.almansoori@lawelite.test', full_name: 'Khalid Al Mansoori' },
        { email: 'wei.chen@lawelite.test', full_name: 'Wei Chen' },
        { email: 'lukas.weber@lawelite.test', full_name: 'Lukas Weber' },
        { email: 'beatriz.santos@lawelite.test', full_name: 'Beatriz Santos' },
    ]) {
        const [row] = await db.User.findOrCreate({ where: { email: u.email }, defaults: { ...u, password_hash: 'external-auth', role: 'lawyer' } });
        lawyerUsers.push(row);
    }
    const clientUsers = [];
    for (const u of [
        { email: 'maria.client@lawelite.test', full_name: 'Maria Gomez' },
        { email: 'james.client@lawelite.test', full_name: 'James Carter' },
        { email: 'lena.client@lawelite.test', full_name: 'Lena Fischer' },
    ]) {
        const [row] = await db.User.findOrCreate({ where: { email: u.email }, defaults: { ...u, password_hash: 'external-auth', role: 'client' } });
        clientUsers.push(row);
    }

    // ── Categories + subcategories ────────────────────────────────────────────
    const catSpec = [
        { name: 'Criminal Law', slug: 'criminal-law', icon: 'Scale', subs: ['DUI Defense', 'White Collar', 'Appeals'] },
        { name: 'Family Law', slug: 'family-law', icon: 'Users', subs: ['Divorce', 'Child Custody', 'Adoption'] },
        { name: 'Corporate Law', slug: 'corporate-law', icon: 'Building2', subs: ['M&A', 'Compliance', 'Contracts'] },
        { name: 'Immigration Law', slug: 'immigration-law', icon: 'Globe', subs: ['Visas', 'Asylum', 'Citizenship'] },
        { name: 'Real Estate Law', slug: 'real-estate-law', icon: 'Home', subs: ['Leasing', 'Disputes', 'Closings'] },
        { name: 'Intellectual Property', slug: 'intellectual-property', icon: 'Lightbulb', subs: ['Patents', 'Trademarks', 'Copyright'] },
    ];
    const categories = {};
    const subcategories = {};
    for (const c of catSpec) {
        const [cat] = await db.Category.findOrCreate({ where: { slug: c.slug }, defaults: { name: c.name, slug: c.slug, icon: c.icon, description: `${c.name} resources, articles and vetted practitioners.`, is_active: true } });
        categories[c.slug] = cat;
        for (const s of c.subs) {
            const sslug = `${c.slug}-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            const [sub] = await db.Subcategory.findOrCreate({ where: { slug: sslug }, defaults: { category_id: cat.id, name: s, slug: sslug, is_active: true } });
            subcategories[sslug] = sub;
        }
    }

    // ── Articles ───────────────────────────────────────────────────────────────
    const articleSpec = [
        { title: 'Understanding Your Rights During a DUI Stop', cat: 'criminal-law', status: 'published' },
        { title: 'A Practical Guide to Filing for Divorce', cat: 'family-law', status: 'published' },
        { title: 'Key Clauses Every Startup Contract Needs', cat: 'corporate-law', status: 'published' },
        { title: 'Navigating the H-1B Visa Process', cat: 'immigration-law', status: 'published' },
        { title: 'What to Check Before Signing a Commercial Lease', cat: 'real-estate-law', status: 'draft' },
        { title: 'Trademark vs. Copyright: What Founders Should Know', cat: 'intellectual-property', status: 'published' },
    ];
    for (const a of articleSpec) {
        const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await db.Article.findOrCreate({
            where: { slug },
            defaults: {
                title: a.title, slug, author_id: admin.id, category_id: categories[a.cat].id,
                excerpt: `${a.title} — an editorial overview from the Law Elite Network knowledge base.`,
                content: `<p>${a.title}.</p><p>This article walks through the essentials with practical, plain-language guidance vetted by our editorial board.</p>`,
                alphabet: a.title.charAt(0).toUpperCase(), tags: [a.cat, 'guide'], views: Math.floor(Math.random() * 900) + 50,
                status: a.status, published_at: a.status === 'published' ? new Date() : null,
            },
        });
    }

    // ── Lawyers ──────────────────────────────────────────────────────────────────
    const lawyerSpec = [
        { u: 0, name: 'Amelia Stone', specs: ['Criminal Law', 'Appeals'], cc: 'US', country: 'United States', city: 'New York', juris: ['New York', 'California'], rate: 350, rating: 4.9, reviews: 128, status: 'active', verified: true, langs: ['English', 'Spanish'], exp: 14 },
        { u: 1, name: 'Raj Patel', specs: ['Corporate Law', 'M&A'], cc: 'US', country: 'United States', city: 'Wilmington', juris: ['Delaware', 'New York'], rate: 480, rating: 4.7, reviews: 86, status: 'active', verified: true, langs: ['English', 'Hindi'], exp: 11 },
        { u: 2, name: 'Sofia Moreno', specs: ['Immigration Law', 'Family Law'], cc: 'US', country: 'United States', city: 'Miami', juris: ['Texas', 'Florida'], rate: 260, rating: 4.8, reviews: 203, status: 'active', verified: true, langs: ['English', 'Spanish', 'Portuguese'], exp: 9 },
        { u: 3, name: 'Noah Kim', specs: ['Intellectual Property', 'Patents'], cc: 'US', country: 'United States', city: 'San Francisco', juris: ['California'], rate: 410, rating: 0, reviews: 0, status: 'pending', verified: false, langs: ['English', 'Korean'], exp: 6 },
        { u: 4, name: 'Oliver Bennett', specs: ['Corporate Law', 'Arbitration'], cc: 'GB', country: 'United Kingdom', city: 'London', juris: ['England & Wales'], rate: 520, rating: 4.9, reviews: 175, status: 'active', verified: true, langs: ['English'], exp: 18 },
        { u: 5, name: 'Priya Nair', specs: ['Family Law', 'Civil Litigation'], cc: 'IN', country: 'India', city: 'Mumbai', juris: ['Maharashtra', 'Supreme Court of India'], rate: 90, rating: 4.8, reviews: 142, status: 'active', verified: true, langs: ['English', 'Hindi', 'Marathi'], exp: 12 },
        { u: 6, name: 'Khalid Al Mansoori', specs: ['Commercial Law', 'Real Estate Law'], cc: 'AE', country: 'United Arab Emirates', city: 'Dubai', juris: ['Dubai', 'DIFC'], rate: 300, rating: 4.7, reviews: 64, status: 'active', verified: true, langs: ['Arabic', 'English'], exp: 10 },
        { u: 7, name: 'Wei Chen', specs: ['Intellectual Property', 'Corporate Law'], cc: 'SG', country: 'Singapore', city: 'Singapore', juris: ['Singapore'], rate: 380, rating: 4.9, reviews: 98, status: 'active', verified: true, langs: ['English', 'Mandarin'], exp: 13 },
        { u: 8, name: 'Lukas Weber', specs: ['Tax Law', 'Compliance'], cc: 'DE', country: 'Germany', city: 'Berlin', juris: ['Germany'], rate: 340, rating: 4.6, reviews: 51, status: 'active', verified: true, langs: ['German', 'English'], exp: 9 },
        { u: 9, name: 'Beatriz Santos', specs: ['Labor Law', 'Civil Litigation'], cc: 'BR', country: 'Brazil', city: 'São Paulo', juris: ['São Paulo', 'OAB'], rate: 120, rating: 4.8, reviews: 110, status: 'active', verified: true, langs: ['Portuguese', 'English', 'Spanish'], exp: 15 },
    ];
    const lawyers = [];
    for (const l of lawyerSpec) {
        const uid = String(lawyerUsers[l.u].id);
        const [row] = await db.Lawyer.findOrCreate({
            where: { user_id: uid },
            defaults: {
                user_id: uid, name: l.name, email: lawyerUsers[l.u].email, specializations: l.specs, jurisdictions: l.juris,
                country_code: l.cc, country: l.country, city: l.city,
                bar_number: `BAR-${100000 + l.u * 137}`, experience: l.exp, hourly_rate: l.rate, rating: l.rating, total_reviews: l.reviews,
                bio: `${l.name} is a ${l.specs.join(' & ')} attorney based in ${l.city}, ${l.country}, with ${l.exp} years of experience advising clients across ${l.juris.join(', ')}.`,
                languages: l.langs, verified: l.verified, status: l.status,
                availability: { mon: ['09:00-17:00'], tue: ['09:00-17:00'], wed: ['09:00-17:00'], thu: ['09:00-17:00'], fri: ['09:00-13:00'] },
            },
        });
        // Back-fill country fields on rows seeded before the global-directory columns existed.
        if (!row.country) await row.update({ country_code: l.cc, country: l.country, city: l.city });
        lawyers.push(row);
    }

    // ── Clients ──────────────────────────────────────────────────────────────────
    const clientSpec = [
        { u: 0, name: 'Maria Gomez', phone: '+1-202-555-0101', location: 'New York, NY', tier: 'PROFESSIONAL' },
        { u: 1, name: 'James Carter', phone: '+1-202-555-0144', location: 'Austin, TX', tier: 'BASIC' },
        { u: 2, name: 'Lena Fischer', phone: '+1-202-555-0190', location: 'Miami, FL', tier: 'ENTERPRISE' },
    ];
    const clients = [];
    for (const c of clientSpec) {
        const uid = String(clientUsers[c.u].id);
        const [row] = await db.Client.findOrCreate({
            where: { user_id: uid },
            defaults: { user_id: uid, name: c.name, email: clientUsers[c.u].email, phone: c.phone, location: c.location, preferred_language: 'en', subscription_tier: c.tier },
        });
        clients.push(row);
    }

    // ── Volume tables (only when empty) ────────────────────────────────────────
    if ((await db.Case.count()) === 0) {
        await db.Case.bulkCreate([
            { client_id: clients[0].id, lawyer_id: lawyers[0].id, title: 'State v. Gomez — Appeal Preparation', description: 'Appeal of a misdemeanor conviction.', category: 'Criminal Law', status: 'in_progress', priority: 'high' },
            { client_id: clients[1].id, lawyer_id: lawyers[1].id, title: 'Acme Inc. Series A Financing', description: 'Corporate counsel for a Series A round.', category: 'Corporate Law', status: 'open', priority: 'medium' },
            { client_id: clients[2].id, lawyer_id: lawyers[2].id, title: 'Fischer Family Reunification Petition', description: 'Immigration petition for family reunification.', category: 'Immigration Law', status: 'open', priority: 'urgent' },
            { client_id: clients[0].id, lawyer_id: lawyers[0].id, title: 'Closed Matter — Records Sealing', description: 'Completed records-sealing request.', category: 'Criminal Law', status: 'closed', priority: 'low', outcome: 'Granted', closed_at: new Date() },
        ]);
    }
    const cases = await db.Case.findAll({ order: [['id', 'ASC']] });

    if ((await db.Booking.count()) === 0) {
        const now = Date.now();
        await db.Booking.bulkCreate([
            { client_id: clients[0].id, lawyer_id: lawyers[0].id, case_id: cases[0].id, type: 'consultation', scheduled_at: new Date(now + 2 * 864e5), duration: 60, status: 'confirmed', total_amount: 350, notes: 'Initial appeal strategy session.' },
            { client_id: clients[1].id, lawyer_id: lawyers[1].id, case_id: cases[1].id, type: 'representation', scheduled_at: new Date(now + 5 * 864e5), duration: 90, status: 'pending', total_amount: 720, notes: 'Term sheet review.' },
            { client_id: clients[2].id, lawyer_id: lawyers[2].id, case_id: cases[2].id, type: 'consultation', scheduled_at: new Date(now - 3 * 864e5), duration: 45, status: 'completed', total_amount: 195, notes: 'Eligibility assessment.' },
            { client_id: clients[0].id, lawyer_id: lawyers[0].id, case_id: cases[3].id, type: 'review', scheduled_at: new Date(now - 10 * 864e5), duration: 30, status: 'cancelled', total_amount: 0, notes: 'Client rescheduled.' },
        ]);
    }
    const bookings = await db.Booking.findAll({ order: [['id', 'ASC']] });

    if ((await db.Payment.count()) === 0) {
        await db.Payment.bulkCreate([
            { booking_id: bookings[0].id, client_id: clients[0].id, lawyer_id: lawyers[0].id, amount: 350, currency: 'USD', status: 'succeeded', provider: 'stripe', provider_tx_id: 'pi_demo_001' },
            { booking_id: bookings[2].id, client_id: clients[2].id, lawyer_id: lawyers[2].id, amount: 195, currency: 'USD', status: 'succeeded', provider: 'stripe', provider_tx_id: 'pi_demo_002' },
            { booking_id: bookings[1].id, client_id: clients[1].id, lawyer_id: lawyers[1].id, amount: 720, currency: 'USD', status: 'pending', provider: 'stripe', provider_tx_id: 'pi_demo_003' },
        ]);
    }

    if ((await db.Review.count()) === 0) {
        await db.Review.bulkCreate([
            { booking_id: bookings[2].id, client_id: clients[2].id, lawyer_id: lawyers[2].id, rating: 5, comment: 'Sofia was clear, fast and reassuring. Highly recommend.' },
            { booking_id: bookings[0].id, client_id: clients[0].id, lawyer_id: lawyers[0].id, rating: 5, comment: 'Amelia knows appellate work inside out.' },
        ]);
    }

    if ((await db.Subscription.count()) === 0) {
        await db.Subscription.bulkCreate([
            { client_id: clients[0].id, tier: 'PROFESSIONAL', status: 'active', started_at: new Date(), expires_at: new Date(Date.now() + 365 * 864e5) },
            { client_id: clients[2].id, tier: 'ENTERPRISE', status: 'active', started_at: new Date(), expires_at: new Date(Date.now() + 365 * 864e5) },
        ]);
    }

    if ((await db.Notification.count()) === 0) {
        await db.Notification.bulkCreate([
            { user_id: String(lawyerUsers[0].id), type: 'booking_request', title: 'New booking request', message: 'Maria Gomez requested a consultation.', read: false },
            { user_id: String(clientUsers[0].id), type: 'booking_accepted', title: 'Booking confirmed', message: 'Your session with Amelia Stone is confirmed.', read: true },
            { user_id: String(admin.id), type: 'verification_update', title: 'Lawyer pending verification', message: 'Noah Kim submitted credentials for review.', read: false },
        ]);
    }

    if ((await db.Referral.count()) === 0) {
        await db.Referral.bulkCreate([
            { referrer_id: String(clientUsers[0].id), referee_id: String(clientUsers[1].id), code: 'MARIA-2026', status: 'completed', reward: 25 },
            { referrer_id: String(clientUsers[2].id), code: 'LENA-2026', status: 'pending', reward: 0 },
        ]);
    }

    const counts = {};
    for (const m of ['User', 'Category', 'Subcategory', 'Article', 'Lawyer', 'Client', 'Case', 'Booking', 'Payment', 'Review', 'Subscription', 'Notification', 'Referral']) {
        counts[m] = await db[m].count();
    }
    console.log('[seed] done:', JSON.stringify(counts));
    await db.sequelize.close();
}

seed().catch((err) => { console.error('[seed] failed:', err); process.exit(1); });
