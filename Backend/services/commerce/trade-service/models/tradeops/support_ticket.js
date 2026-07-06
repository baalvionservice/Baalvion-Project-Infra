'use strict';
// Support/ticketing module (Phase 1 Buyer workspace) — a self-service support
// ticket, optionally linked to the order/RFQ/shipment it concerns.
// Schema `tradeops`, UUID PK, tenant-scoped (RLS + models/index.js hooks).
// See migration 022.
module.exports = (sequelize, DataTypes) => {
    const SupportTicket = sequelize.define('SupportTicket', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        created_by_user_id: { type: DataTypes.TEXT },
        created_by_org_id: { type: DataTypes.TEXT },
        subject: { type: DataTypes.TEXT, allowNull: false },
        description: { type: DataTypes.TEXT },
        category: { type: DataTypes.TEXT },
        priority: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'medium',
            validate: { isIn: [['low', 'medium', 'high', 'urgent']] },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'open',
            validate: { isIn: [['open', 'in_progress', 'resolved', 'closed']] },
        },
        related_entity_type: { type: DataTypes.TEXT },
        related_entity_id: { type: DataTypes.TEXT },
        resolved_at: { type: DataTypes.DATE },
    }, {
        schema: 'tradeops',
        tableName: 'support_tickets',
        underscored: true,
        timestamps: true,
    });

    SupportTicket.associate = (db) => {
        if (db.SupportTicketMessage) {
            SupportTicket.hasMany(db.SupportTicketMessage, { as: 'messages', foreignKey: 'ticket_id' });
        }
    };

    return SupportTicket;
};
