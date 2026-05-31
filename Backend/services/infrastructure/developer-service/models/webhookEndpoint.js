'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('webhook_endpoint', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id:      { type: DataTypes.STRING(128), allowNull: true },
        url:         { type: DataTypes.TEXT, allowNull: false },
        description: { type: DataTypes.STRING(255), allowNull: true },
        secret:      { type: DataTypes.STRING(80), allowNull: false },   // signing secret (whsec_…)
        events:      { type: DataTypes.JSONB, allowNull: false, defaultValue: ['*'] }, // subscribed event types ('*' = all)
        mode:        { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'live' }, // live|test
        status:      { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' }, // active|disabled
        metadata:    { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by:  { type: DataTypes.STRING(64), allowNull: true },
        created_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'webhook_endpoints', schema: 'developer', timestamps: false,
        indexes: [{ fields: ['org_id'] }, { fields: ['status'] }],
    });
};
