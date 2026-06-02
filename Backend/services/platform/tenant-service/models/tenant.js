'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('tenant', {
        id:               { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        slug:             { type: DataTypes.STRING(64), allowNull: false, unique: true }, // url-safe handle
        name:             { type: DataTypes.STRING(160), allowNull: false },
        status:           { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' }, // active|suspended|archived
        plan:             { type: DataTypes.STRING(48), allowNull: false, defaultValue: 'standard' },
        parent_tenant_id: { type: DataTypes.UUID, allowNull: true },   // reseller / sub-tenant hierarchy
        owner_org_id:     { type: DataTypes.STRING(128), allowNull: true },
        owner_user_id:    { type: DataTypes.STRING(64), allowNull: true },
        contact_email:    { type: DataTypes.STRING(160), allowNull: true },
        metadata:         { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by:       { type: DataTypes.STRING(64), allowNull: true },
        created_at:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'tenants', schema: 'tenant', timestamps: false,
        indexes: [{ unique: true, fields: ['slug'] }, { fields: ['owner_org_id'] }, { fields: ['status'] }],
    });
};
