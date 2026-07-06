'use strict';
// Support/ticketing module — append-only thread reply on a support ticket.
// Schema `tradeops`, UUID PK, tenant-scoped (RLS + models/index.js hooks).
// See migration 022.
module.exports = (sequelize, DataTypes) => {
    const SupportTicketMessage = sequelize.define('SupportTicketMessage', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        ticket_id: { type: DataTypes.UUID, allowNull: false },
        author_user_id: { type: DataTypes.TEXT },
        author_role: { type: DataTypes.TEXT },
        body: { type: DataTypes.TEXT, allowNull: false },
    }, {
        schema: 'tradeops',
        tableName: 'support_ticket_messages',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    SupportTicketMessage.associate = (db) => {
        if (db.SupportTicket) {
            SupportTicketMessage.belongsTo(db.SupportTicket, { as: 'ticket', foreignKey: 'ticket_id' });
        }
    };

    return SupportTicketMessage;
};
