'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('webhook_delivery', {
        id:               { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        endpoint_id:      { type: DataTypes.UUID, allowNull: false },
        org_id:           { type: DataTypes.STRING(128), allowNull: true },
        event_type:       { type: DataTypes.STRING(120), allowNull: false },
        event_id:         { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
        payload:          { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        status:           { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' }, // pending|retrying|delivered|failed
        attempts:         { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        max_attempts:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 6 },
        last_status_code: { type: DataTypes.INTEGER, allowNull: true },
        last_error:       { type: DataTypes.TEXT, allowNull: true },
        response_snippet: { type: DataTypes.TEXT, allowNull: true },
        next_attempt_at:  { type: DataTypes.DATE, allowNull: true },
        created_at:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        delivered_at:     { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'webhook_deliveries', schema: 'developer', timestamps: false,
        indexes: [{ fields: ['endpoint_id'] }, { fields: ['status', 'next_attempt_at'] }, { fields: ['org_id'] }],
    });
};
