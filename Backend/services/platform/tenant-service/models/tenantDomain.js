'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('tenant_domain', {
        id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        tenant_id:    { type: DataTypes.UUID, allowNull: false },
        domain:       { type: DataTypes.STRING(255), allowNull: false, unique: true },
        app:          { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'default' }, // which app this domain serves
        verify_token: { type: DataTypes.STRING(120), allowNull: false },
        verified:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        cert_status:  { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' }, // pending|issued|failed
        is_primary:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        verified_at:  { type: DataTypes.DATE, allowNull: true },
        created_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'tenant_domains', schema: 'tenant', timestamps: false,
        indexes: [{ unique: true, fields: ['domain'] }, { fields: ['tenant_id'] }],
    });
};
