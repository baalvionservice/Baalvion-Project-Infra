'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('api_key', {
        id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id:       { type: DataTypes.STRING(128), allowNull: true },
        name:         { type: DataTypes.STRING(160), allowNull: false },
        key_prefix:   { type: DataTypes.STRING(24), allowNull: false },   // public lookup handle (e.g. bk_live_AbC123)
        key_hash:     { type: DataTypes.CHAR(64), allowNull: false },     // sha256(full key)
        last4:        { type: DataTypes.STRING(8), allowNull: true },     // display only
        mode:         { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'live' }, // live|test (sandbox)
        scopes:       { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        status:       { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' }, // active|revoked
        rate_limit_per_min: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 600 },
        metadata:     { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        last_used_at: { type: DataTypes.DATE, allowNull: true },
        last_used_ip: { type: DataTypes.STRING(45), allowNull: true },
        expires_at:   { type: DataTypes.DATE, allowNull: true },
        rotated_at:   { type: DataTypes.DATE, allowNull: true },
        revoked_at:   { type: DataTypes.DATE, allowNull: true },
        created_by:   { type: DataTypes.STRING(64), allowNull: true },
        created_at:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'api_keys', schema: 'developer', timestamps: false,
        indexes: [{ fields: ['key_prefix'] }, { fields: ['org_id'] }, { fields: ['status'] }],
    });
};
