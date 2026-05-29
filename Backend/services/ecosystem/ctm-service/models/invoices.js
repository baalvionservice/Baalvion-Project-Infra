'use strict';
const { DataTypes } = require('sequelize');

// Billing invoices. DB-backed and computable from a subscription; the actual
// payment-gateway charge (Stripe/Razorpay) attaches gateway/gateway_invoice_id later.
module.exports = (sequelize) => sequelize.define('invoices', {
    id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:           { type: DataTypes.UUID, allowNull: false },
    subscription_id:      { type: DataTypes.UUID },
    amount:               { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency:             { type: DataTypes.STRING(3), defaultValue: 'USD' },
    status:               { type: DataTypes.ENUM('Paid', 'Failed', 'Pending', 'Due', 'Overdue'), defaultValue: 'Pending' },
    plan_name:            { type: DataTypes.STRING(120) },
    issued_at:            { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    due_date:             { type: DataTypes.DATE },
    billing_period_start: { type: DataTypes.DATE },
    billing_period_end:   { type: DataTypes.DATE },
    line_items:           { type: DataTypes.JSONB, defaultValue: [] },
    subtotal:             { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    tax:                  { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    pdf_url:              { type: DataTypes.TEXT },
    gateway:              { type: DataTypes.STRING(50) },
    gateway_invoice_id:   { type: DataTypes.STRING(200) },
    metadata:             { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'invoices' });
