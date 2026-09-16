'use strict';
// Clearance Stage Ledger — party visibility.
//
// The ledger records whose time a clearance stage burned, so who may read it is
// a correctness question, not a cosmetic one. Two suites, mirroring the trade
// dashboard suite:
//   1. Pure — the shared scope predicate, exercised through the same policy the
//      ledger and the shipment dashboard both call.
//   2. DB-backed — subject → trade operation resolution and the party subject-id
//      set behind the bottleneck rollup. Skips when no DB is reachable.

const rbac = require('../service/dashboard/rbac');

// ───────────────────────────────────────────────────────────────────────────
// 1. PURE
// ───────────────────────────────────────────────────────────────────────────
describe('rbac.isOperationInScope (shared by the dashboard and the ledger)', () => {
    const op = { buyer_org_id: 'COMP-101', seller_org_id: 'COMP-102' };

    test('a subject with no operation is visible only to tenant-wide roles', () => {
        expect(rbac.isOperationInScope(null, { scope: 'all' }, [])).toBe(true);
        expect(rbac.isOperationInScope(null, { scope: 'buyer' }, ['COMP-101'])).toBe(false);
        expect(rbac.isOperationInScope(null, { scope: 'seller' }, ['COMP-102'])).toBe(false);
        expect(rbac.isOperationInScope(null, { scope: 'party' }, ['COMP-101'])).toBe(false);
    });

    test('a buyer sees the buy side only', () => {
        expect(rbac.isOperationInScope(op, { scope: 'buyer' }, ['COMP-101'])).toBe(true);
        expect(rbac.isOperationInScope(op, { scope: 'buyer' }, ['COMP-102'])).toBe(false);
    });

    test('a seller sees the sell side only', () => {
        expect(rbac.isOperationInScope(op, { scope: 'seller' }, ['COMP-102'])).toBe(true);
        expect(rbac.isOperationInScope(op, { scope: 'seller' }, ['COMP-101'])).toBe(false);
    });

    test('an org with no party identity is refused, not defaulted through', () => {
        expect(rbac.isOperationInScope(op, { scope: 'buyer' }, [])).toBe(false);
        expect(rbac.isOperationInScope(op, { scope: 'party' }, [null, undefined])).toBe(false);
    });

    test('logistics and bank resolve to tenant-wide ledger reads; a role-less caller to none', () => {
        expect(rbac.resolve(['logistics']).scope).toBe('all');
        expect(rbac.resolve(['bank']).scope).toBe('all');
        expect(rbac.resolve(['guest']).allowed).toBe(false);
    });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. DB-BACKED — skips when no DB.
// ───────────────────────────────────────────────────────────────────────────
describe('clearance access (DB-backed)', () => {
    let db; let access; let dbUp = false;
    const STAMP = `${Date.now()}`;
    const TENANT = `T-CLR-${STAMP}`;
    const BUYER = `COMP-B-${STAMP}`;
    const SELLER = `COMP-S-${STAMP}`;
    const OUTSIDER = `COMP-X-${STAMP}`;
    const buyerAccess = { scope: 'buyer', isAdmin: false, canComment: true };
    const sellerAccess = { scope: 'seller', isAdmin: false, canComment: true };
    const adminAccess = { scope: 'all', isAdmin: true, canComment: true };

    let operation; let shipment; let foreignShipment;

    beforeAll(async () => {
        db = require('../models');
        access = require('../service/clearance/access');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            dbUp = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[clearance-access] DB unavailable — skipping:', err.message);
            return;
        }

        operation = await db.TradeOperation.create({
            tenant_id: TENANT, reference_no: `TO-CLR-${STAMP}`, buyer_org_id: BUYER, seller_org_id: SELLER,
            commodity: 'Test Goods', status: 'in_transit', priority: 'normal', currency: 'USD', created_by: 'test',
        });
        shipment = await db.TradeShipment.create({
            tenant_id: TENANT, trade_operation_id: operation.id, shipment_no: `SHP-CLR-${STAMP}`,
            mode: 'sea', origin_port: 'CNSHA', destination_port: 'USLGB', status: 'in_transit', created_by: 'test',
        });

        // A trade the caller is party to NEITHER side of — same tenant, so tenant
        // isolation alone would happily hand it over.
        const foreignOp = await db.TradeOperation.create({
            tenant_id: TENANT, reference_no: `TO-FOR-${STAMP}`, buyer_org_id: OUTSIDER, seller_org_id: `${OUTSIDER}-2`,
            commodity: 'Other Goods', status: 'active', priority: 'normal', currency: 'USD', created_by: 'test',
        });
        foreignShipment = await db.TradeShipment.create({
            tenant_id: TENANT, trade_operation_id: foreignOp.id, shipment_no: `SHP-FOR-${STAMP}`,
            mode: 'sea', origin_port: 'AEJEA', destination_port: 'NLRTM', status: 'in_transit', created_by: 'test',
        });
    });

    afterAll(async () => {
        if (dbUp && db) await db.sequelize.close();
    });

    const maybe = (name, fn) => test(name, async () => { if (!dbUp) return; await fn(); });

    maybe('resolves a shipment subject back to its trade operation', async () => {
        const op = await access.operationForSubject({ subjectType: 'shipment', subjectId: shipment.id });
        expect(op).toBeTruthy();
        expect(op.id).toBe(operation.id);
    });

    maybe('a trade_operation subject resolves to itself', async () => {
        const op = await access.operationForSubject({ subjectType: 'trade_operation', subjectId: operation.id });
        expect(op.id).toBe(operation.id);
    });

    maybe('an unknown subject resolves to null rather than throwing', async () => {
        const op = await access.operationForSubject({ subjectType: 'shipment', subjectId: '00000000-0000-0000-0000-000000000000' });
        expect(op).toBeNull();
    });

    maybe('both parties to the trade are in scope for its clearance clock', async () => {
        const subject = { subjectType: 'shipment', subjectId: shipment.id };
        await expect(access.isSubjectInScope(subject, buyerAccess, [BUYER])).resolves.toBe(true);
        await expect(access.isSubjectInScope(subject, sellerAccess, [SELLER])).resolves.toBe(true);
    });

    maybe('a same-tenant non-party is NOT in scope', async () => {
        const subject = { subjectType: 'shipment', subjectId: foreignShipment.id };
        await expect(access.isSubjectInScope(subject, buyerAccess, [BUYER])).resolves.toBe(false);
        await expect(access.isSubjectInScope(subject, sellerAccess, [SELLER])).resolves.toBe(false);
        // ...while a tenant-wide role still reads it.
        await expect(access.isSubjectInScope(subject, adminAccess, [])).resolves.toBe(true);
    });

    maybe('the buyer side is not readable with the seller scope, and vice versa', async () => {
        const subject = { subjectType: 'shipment', subjectId: shipment.id };
        await expect(access.isSubjectInScope(subject, buyerAccess, [SELLER])).resolves.toBe(false);
        await expect(access.isSubjectInScope(subject, sellerAccess, [BUYER])).resolves.toBe(false);
    });

    maybe('the bottleneck subject set covers the party operation and its shipments only', async () => {
        const ids = await access.partySubjectIds(buyerAccess, [BUYER]);
        expect(ids).toContain(operation.id);
        expect(ids).toContain(shipment.id);
        expect(ids).not.toContain(foreignShipment.id);
    });

    maybe('a tenant-wide role gets no subject filter; a party to nothing gets an empty one', async () => {
        await expect(access.partySubjectIds(adminAccess, [])).resolves.toBeNull();
        // An empty ARRAY, not null — the caller must render an empty rollup, not
        // fall through to the whole tenant's book.
        await expect(access.partySubjectIds(buyerAccess, [`COMP-NOBODY-${STAMP}`])).resolves.toEqual([]);
        await expect(access.partySubjectIds(buyerAccess, [])).resolves.toEqual([]);
    });

    maybe('OUTSIDER is party to its own trade and nothing of ours', async () => {
        const ids = await access.partySubjectIds(buyerAccess, [OUTSIDER]);
        expect(ids).toContain(foreignShipment.id);
        expect(ids).not.toContain(shipment.id);
        expect(ids).not.toContain(operation.id);
    });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. PARTY IDENTITY — gateway user → trade party. DB-backed; skips without one.
// ───────────────────────────────────────────────────────────────────────────
describe('partyIdentity.resolveParty (DB-backed)', () => {
    let db; let partyIdentity; let dbUp = false;
    const STAMP = `${Date.now()}`;
    const BUYER_TENANT = `T-PI-B-${STAMP}`;
    const SELLER_TENANT = `T-PI-S-${STAMP}`;
    const BUYER_CODE = `COMP-PI-B-${STAMP}`;
    const SELLER_CODE = `COMP-PI-S-${STAMP}`;

    beforeAll(async () => {
        db = require('../models');
        partyIdentity = require('../service/dashboard/partyIdentity');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            dbUp = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[party-identity] DB unavailable — skipping:', err.message);
            return;
        }
        await db.Organization.bulkCreate([
            { tenant_id: BUYER_TENANT, code: BUYER_CODE, name: `Buyer Co ${STAMP}`, type: 'buyer', status: 'active' },
            { tenant_id: SELLER_TENANT, code: SELLER_CODE, name: `Seller Co ${STAMP}`, type: 'seller', status: 'active' },
        ]);
    });

    afterAll(async () => {
        if (dbUp && db) await db.sequelize.close();
    });

    const maybe = (name, fn) => test(name, async () => { if (!dbUp) return; await fn(); });

    maybe('an org of type buyer resolves to buyer scope and its trade org CODE', async () => {
        // Membership roles only — no 'buyer' role on the token, which is the
        // situation the gateway actually produces.
        const req = { auth: { orgId: BUYER_TENANT, tenantId: BUYER_TENANT, roles: ['member'] } };
        const { access, partyOrgIds, organization } = await partyIdentity.resolveParty(req);
        expect(access.allowed).toBe(true);
        expect(access.scope).toBe('buyer');
        expect(organization.code).toBe(BUYER_CODE);
        // The CODE is what trade_operations.buyer_org_id actually holds — matching
        // on the gateway org id alone is what made this unreachable before.
        expect(partyOrgIds).toContain(BUYER_CODE);
    });

    maybe('an org of type seller resolves to seller scope', async () => {
        const req = { auth: { orgId: SELLER_TENANT, tenantId: SELLER_TENANT, roles: ['member'] } };
        const { access, partyOrgIds } = await partyIdentity.resolveParty(req);
        expect(access.scope).toBe('seller');
        expect(partyOrgIds).toContain(SELLER_CODE);
    });

    maybe('an admin stays tenant-wide without needing a party identity', async () => {
        const req = { auth: { orgId: BUYER_TENANT, roles: ['admin'] } };
        const { access } = await partyIdentity.resolveParty(req);
        expect(access.scope).toBe('all');
        expect(access.isAdmin).toBe(true);
    });

    maybe('an unresolvable org is refused rather than defaulted to a scope', async () => {
        const req = { auth: { orgId: `T-NOBODY-${STAMP}`, roles: ['member'] } };
        const { access, partyOrgIds } = await partyIdentity.resolveParty(req);
        expect(access.allowed).toBe(false);
        expect(access.scope).toBe('none');
        // The gateway org id is still carried, but it matches no operation party.
        expect(partyOrgIds).not.toContain(null);
    });
});
