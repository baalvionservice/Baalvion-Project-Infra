'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Product', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.TEXT, allowNull: false },
    sku: { type: DataTypes.TEXT, allowNull: false },
    gtin: { type: DataTypes.TEXT },
    name: { type: DataTypes.TEXT, allowNull: false },
    hs_code: { type: DataTypes.TEXT, allowNull: false },
    uom: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'EA' },
    origin_country: { type: DataTypes.CHAR(2) },
    hazmat: { type: DataTypes.BOOLEAN, defaultValue: false },
    attributes: { type: DataTypes.JSONB, defaultValue: {} },
    status: { type: DataTypes.ENUM('active', 'retired', 'draft'), defaultValue: 'active' },
}, { schema: 'product', tableName: 'products', underscored: true, timestamps: true });
