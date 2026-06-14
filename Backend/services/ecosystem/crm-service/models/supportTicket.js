'use strict';
// A customer support ticket — CRM-adjacent (it belongs to a client and a brand). The
// thread of messages is carried in a JSONB column; status/priority drive the support queue.
module.exports = (sequelize, DataTypes) => {
    const SupportTicket = sequelize.define('SupportTicket', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        customerId: { type: DataTypes.STRING },
        customerName: { type: DataTypes.STRING, allowNull: false },
        customerEmail: { type: DataTypes.STRING },
        customerTier: { type: DataTypes.STRING },
        subject: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, defaultValue: 'open' },
        priority: { type: DataTypes.STRING, defaultValue: 'normal' },
        category: { type: DataTypes.STRING },
        lastMessage: { type: DataTypes.TEXT },
        messages: { type: DataTypes.JSONB, defaultValue: [] },
    }, {
        schema: 'crm',
        tableName: 'support_tickets',
        underscored: true,
        timestamps: true,
    });
    return SupportTicket;
};
