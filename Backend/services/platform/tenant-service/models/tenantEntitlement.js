'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('tenant_entitlement', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        tenant_id:   { type: DataTypes.UUID, allowNull: false },
        feature_key: { type: DataTypes.STRING(96), allowNull: false }, // e.g. 'seats', 'api_calls_per_day', 'feature.sso'
        enabled:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        limit_value: { type: DataTypes.BIGINT, allowNull: true },      // null = unlimited / not a quota
        used_value:  { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
        metadata:    { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        updated_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'tenant_entitlements', schema: 'tenant', timestamps: false,
        indexes: [{ unique: true, fields: ['tenant_id', 'feature_key'] }],
    });
};
