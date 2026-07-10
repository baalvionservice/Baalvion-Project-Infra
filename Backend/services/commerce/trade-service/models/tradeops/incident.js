'use strict';
// Logistics Core Foundation (Phase 3) — shipment incident (damage, loss,
// delay, theft, accident, customs hold). Schema `tradeops`, UUID PK, paranoid,
// versioned.
module.exports = (sequelize, DataTypes) => {
    const Incident = sequelize.define('Incident', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        container_id: { type: DataTypes.UUID },
        incident_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['damage', 'loss', 'delay', 'theft', 'customs_hold', 'accident', 'other']] },
        },
        severity: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'medium',
            validate: { isIn: [['low', 'medium', 'high', 'critical']] },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'open',
            validate: { isIn: [['open', 'investigating', 'resolved', 'closed']] },
        },
        description: { type: DataTypes.TEXT, allowNull: false },
        reported_by: { type: DataTypes.TEXT },
        reported_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        resolved_at: { type: DataTypes.DATE },
        resolution_notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'incidents',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    Incident.associate = (db) => {
        Incident.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        Incident.belongsTo(db.Container, { as: 'container', foreignKey: 'container_id' });
    };

    return Incident;
};
