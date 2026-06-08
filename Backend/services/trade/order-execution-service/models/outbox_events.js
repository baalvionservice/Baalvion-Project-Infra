'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('OutboxEvent', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    tenant_id: { type: DataTypes.TEXT, allowNull: false },
    aggregate_type: { type: DataTypes.TEXT, allowNull: false },
    aggregate_id: { type: DataTypes.TEXT, allowNull: false },
    event_type: { type: DataTypes.TEXT, allowNull: false },
    payload: { type: DataTypes.JSONB, allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'), defaultValue: 'PENDING' },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_error: { type: DataTypes.TEXT },
    available_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    sent_at: { type: DataTypes.DATE },
}, { schema: 'oms', tableName: 'outbox_events', underscored: true, timestamps: true, updatedAt: false });
