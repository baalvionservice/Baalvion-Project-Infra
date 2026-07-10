'use strict';
module.exports = (sequelize, DataTypes) => {
    const FinancedInvoice = sequelize.define('FinancedInvoice', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tenant_id: { type: DataTypes.TEXT },
        order_id: { type: DataTypes.INTEGER },
        invoice_ref: { type: DataTypes.TEXT, allowNull: false },
        java_invoice_id: { type: DataTypes.UUID },
        seller_org_id: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.ENUM('funded', 'collected', 'closed'),
            defaultValue: 'funded',
        },
        amount: { type: DataTypes.DECIMAL(19, 4) },
        currency: { type: DataTypes.STRING(10) },
        funded_at: { type: DataTypes.DATE },
        collected_at: { type: DataTypes.DATE },
    }, {
        schema: 'trade',
        tableName: 'financed_invoices',
        underscored: true,
        timestamps: true,
    });

    return FinancedInvoice;
};
