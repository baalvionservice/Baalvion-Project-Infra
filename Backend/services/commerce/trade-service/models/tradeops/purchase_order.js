'use strict';
// Purchase Orders (Phase 1 MVP) — the formal buyer→seller order document, generated
// after a quotation is accepted. Distinct from `trade.orders` (the fulfillment
// record): a PurchaseOrder carries the commercial document fields the spec calls
// for (multi-line items, tax, shipping/payment terms) and, once accepted, links to
// the Order created to track fulfillment. Schema `tradeops`, UUID PK, tenant-scoped
// (RLS + models/index.js hooks). See migration 024.
module.exports = (sequelize, DataTypes) => {
    const PurchaseOrder = sequelize.define('PurchaseOrder', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        po_number: { type: DataTypes.TEXT, allowNull: false },
        deal_id: { type: DataTypes.TEXT },
        quotation_id: { type: DataTypes.TEXT },
        rfq_id: { type: DataTypes.TEXT },
        buyer_org_id: { type: DataTypes.TEXT, allowNull: false },
        seller_org_id: { type: DataTypes.TEXT, allowNull: false },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        // [{ product, description, quantity, unit_price, tax_rate }]
        line_items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        subtotal: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
        tax_total: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
        total_value: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
        shipping_terms: { type: DataTypes.TEXT },
        payment_terms: { type: DataTypes.TEXT },
        delivery_date: { type: DataTypes.DATE },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'issued', 'accepted', 'rejected', 'cancelled']] },
        },
        order_id: { type: DataTypes.TEXT },
        notes: { type: DataTypes.TEXT },
        created_by_user_id: { type: DataTypes.TEXT },
        issued_at: { type: DataTypes.DATE },
        responded_at: { type: DataTypes.DATE },
    }, {
        schema: 'tradeops',
        tableName: 'purchase_orders',
        underscored: true,
        timestamps: true,
    });

    return PurchaseOrder;
};
