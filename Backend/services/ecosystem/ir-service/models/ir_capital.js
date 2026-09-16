'use strict';
/**
 * Capital account domain — the fund-accounting core of the investor portal.
 *
 * The portal has always shown a commitment, called capital, distributions, NAV and IRR, but none
 * of it was ever modelled: the frontend returned hardcoded figures. These are the tables those
 * numbers have to come from.
 *
 * Money is DECIMAL(20,2) and never a float. Every amount carries its currency. Balances are
 * DERIVED from the call and distribution ledgers rather than stored on the commitment, so the
 * portal cannot drift out of agreement with its own history — see service/capitalService.js.
 */
module.exports = (sequelize, DataTypes) => {
    const opts = (tableName) => ({ schema: 'ir', tableName, underscored: true, timestamps: true });

    // What an investor has contractually agreed to fund. One row per investor per vehicle.
    const IrCommitment = sequelize.define('IrCommitment', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id: { type: DataTypes.UUID, allowNull: false },
        investor_user_id: { type: DataTypes.STRING(120), allowNull: false },
        investor_name: { type: DataTypes.STRING(300), allowNull: false },
        vehicle: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'baalvion' },
        commitment_amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
        // signed → the subscription agreement is executed and calls may be issued against it.
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
        committed_on: { type: DataTypes.DATEONLY },
    }, opts('ir_commitments'));

    // A drawdown notice issued against the vehicle. Legally significant: it is a demand for money.
    const IrCapitalCall = sequelize.define('IrCapitalCall', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id: { type: DataTypes.UUID, allowNull: false },
        vehicle: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'baalvion' },
        reference: { type: DataTypes.STRING(40), allowNull: false },
        call_pct: { type: DataTypes.DECIMAL(7, 4) },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
        purpose: { type: DataTypes.TEXT },
        // draft → issued → settled|cancelled. Nothing is sent to an investor while draft.
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'draft' },
        call_date: { type: DataTypes.DATEONLY },
        due_date: { type: DataTypes.DATEONLY },
        issued_at: { type: DataTypes.DATE },
        issued_by: { type: DataTypes.STRING(120) },
    }, opts('ir_capital_calls'));

    // One investor's share of a call, and the money actually received against it.
    const IrCallAllocation = sequelize.define('IrCallAllocation', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        call_id: { type: DataTypes.UUID, allowNull: false },
        commitment_id: { type: DataTypes.UUID, allowNull: false },
        amount_due: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        amount_received: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
        // outstanding → part_paid → paid. Only a recorded receipt moves it.
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'outstanding' },
        // Bank reference for the receipt. Required to mark money in — a wire is not "confirmed"
        // because someone clicked a button.
        settlement_ref: { type: DataTypes.STRING(200) },
        settled_at: { type: DataTypes.DATE },
        settled_by: { type: DataTypes.STRING(120) },
    }, opts('ir_call_allocations'));

    // Individual receipts against a call allocation.
    //
    // amount_received used to be incremented in place, so posting the same bank reference twice —
    // a webhook retry, a double-click, a re-run of a reconciliation job — silently DOUBLED the
    // money recorded, unless it happened to exceed the amount due. A receipt is a fact with an
    // identity: one row per bank reference, UNIQUE per allocation, and the allocation's total is
    // derived from them. The database now refuses the duplicate rather than the code remembering to.
    const IrCallReceipt = sequelize.define('IrCallReceipt', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        allocation_id: { type: DataTypes.UUID, allowNull: false },
        amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
        settlement_ref: { type: DataTypes.STRING(200), allowNull: false },
        received_on: { type: DataTypes.DATEONLY },
        recorded_by: { type: DataTypes.STRING(120) },
    }, opts('ir_call_receipts'));

    // Money returned to an investor.
    const IrDistribution = sequelize.define('IrDistribution', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id: { type: DataTypes.UUID, allowNull: false },
        commitment_id: { type: DataTypes.UUID, allowNull: false },
        reference: { type: DataTypes.STRING(40) },
        amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
        kind: { type: DataTypes.STRING(20), defaultValue: 'income' },
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'declared' },
        paid_on: { type: DataTypes.DATEONLY },
        settlement_ref: { type: DataTypes.STRING(200) },
    }, opts('ir_distributions'));

    // Point-in-time valuation of the vehicle. The portal's NAV line is these rows, nothing else.
    const IrNavPoint = sequelize.define('IrNavPoint', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id: { type: DataTypes.UUID, allowNull: false },
        vehicle: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'baalvion' },
        as_of: { type: DataTypes.DATEONLY, allowNull: false },
        nav_total: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
        // Who produced the valuation and on what basis — a NAV with no provenance is an assertion.
        basis: { type: DataTypes.STRING(40) },
        source: { type: DataTypes.STRING(200) },
        published_at: { type: DataTypes.DATE },
    }, opts('ir_nav_points'));

    return { IrCommitment, IrCapitalCall, IrCallAllocation, IrCallReceipt, IrDistribution, IrNavPoint };
};
