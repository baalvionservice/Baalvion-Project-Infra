'use strict';
/**
 * Persist the 5-market commerce context on every order so money is correct and auditable
 * (us/uk/ae/in/sg — one shared store, base USD, per-country price + tax).
 *
 * ADDITIVE + NULLABLE: all columns are nullable / defaulted so existing rows and the prior
 * create path are unaffected. `currency_code` and per-line/order `tax_amount` already exist
 * (see 20260205/20260206) — this only adds the *descriptive* market + tax-shape fields that
 * were previously lost: which market the order was placed in, the kind of tax, the effective
 * rate, and whether tax is included in the line price / total.
 *
 *   orders_orders:      market, tax_type, tax_rate, tax_inclusive
 *   orders_order_items: tax_rate, tax_inclusive
 *
 * Money precision matches the 20260210 widening (DECIMAL(15,4)) for the rate columns.
 * Reversible: `down` drops only the columns this migration added.
 */
const ORDERS = { tableName: 'orders_orders', schema: 'orders' };
const ITEMS = { tableName: 'orders_order_items', schema: 'orders' };

module.exports = {
    async up(queryInterface, Sequelize) {
        const t = await queryInterface.sequelize.transaction();
        try {
            // ── Order-level market context ────────────────────────────────────────
            await queryInterface.addColumn(ORDERS, 'market', {
                // ISO country / market code: us | uk | ae | in | sg. Nullable for legacy rows.
                type: Sequelize.STRING(2), allowNull: true,
            }, { transaction: t });
            await queryInterface.addColumn(ORDERS, 'tax_type', {
                // SALES_TAX | VAT | GST — the kind of tax that applied for this market.
                type: Sequelize.STRING(20), allowNull: true,
            }, { transaction: t });
            await queryInterface.addColumn(ORDERS, 'tax_rate', {
                // Effective tax rate as a percentage (e.g. 8.50, 20.00). Nullable for legacy rows.
                type: Sequelize.DECIMAL(7, 4), allowNull: true,
            }, { transaction: t });
            await queryInterface.addColumn(ORDERS, 'tax_inclusive', {
                // true => tax is already inside the line price/total (VAT/GST markets);
                // false => tax is added on top (US sales tax). Defaults false to preserve
                // the historical exclusive-by-omission behaviour for existing rows.
                type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
            }, { transaction: t });

            // ── Per-line tax shape (for line-level audit / re-derivation) ─────────
            await queryInterface.addColumn(ITEMS, 'tax_rate', {
                type: Sequelize.DECIMAL(7, 4), allowNull: true,
            }, { transaction: t });
            await queryInterface.addColumn(ITEMS, 'tax_inclusive', {
                type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
            }, { transaction: t });

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },

    async down(queryInterface) {
        const t = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.removeColumn(ITEMS, 'tax_inclusive', { transaction: t });
            await queryInterface.removeColumn(ITEMS, 'tax_rate', { transaction: t });
            await queryInterface.removeColumn(ORDERS, 'tax_inclusive', { transaction: t });
            await queryInterface.removeColumn(ORDERS, 'tax_rate', { transaction: t });
            await queryInterface.removeColumn(ORDERS, 'tax_type', { transaction: t });
            await queryInterface.removeColumn(ORDERS, 'market', { transaction: t });
            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },
};
