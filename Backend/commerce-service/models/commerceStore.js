'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_stores', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        organizationId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        countryCode: { type: DataTypes.CHAR(2), allowNull: false },
        currencyCode: { type: DataTypes.CHAR(3), allowNull: false },
        locale: { type: DataTypes.STRING(20), defaultValue: 'en' },
        timezone: { type: DataTypes.STRING(50), defaultValue: 'UTC' },
        status: { type: DataTypes.ENUM('active', 'inactive', 'maintenance'), defaultValue: 'active' },
        taxInclusive: { type: DataTypes.BOOLEAN, defaultValue: false },
        defaultTaxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
        paymentGateways: { type: DataTypes.JSONB, defaultValue: [] },
        shippingConfig: { type: DataTypes.JSONB, defaultValue: {} },
        seoConfig: { type: DataTypes.JSONB, defaultValue: {} },
        meta: { type: DataTypes.JSONB, defaultValue: {} },
        createdBy: { type: DataTypes.BIGINT, allowNull: false },
    }, { schema: 'commerce', tableName: 'commerce_stores', underscored: true, timestamps: true, indexes: [{ fields: ['organization_id'] }, { fields: ['status'] }, { unique: true, fields: ['code'] }] });
};
