'use strict';
// A private high-ticket sales inquiry raised by a shopper (from a product/service/private-order
// page) and the curator's reply thread. Distinct from SupportTicket: this tracks a sales-funnel
// lifecycle (new -> contacted -> qualifying -> presenting -> closing -> won/lost), not a support
// queue. The thread of messages is carried in a JSONB column, same pattern as SupportTicket.
const LEAD_STATUSES = ['new', 'contacted', 'qualifying', 'presenting', 'closing', 'won', 'lost'];

module.exports = (sequelize, DataTypes) => {
    const Inquiry = sequelize.define('Inquiry', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        customerId: { type: DataTypes.STRING },
        customerName: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING },
        country: { type: DataTypes.STRING },
        budgetRange: { type: DataTypes.STRING },
        intent: { type: DataTypes.STRING },
        contactMethod: { type: DataTypes.STRING },
        productId: { type: DataTypes.STRING },
        serviceId: { type: DataTypes.STRING },
        leadTier: { type: DataTypes.INTEGER, defaultValue: 3 },
        status: { type: DataTypes.STRING, defaultValue: 'new' },
        message: { type: DataTypes.TEXT },
        messages: { type: DataTypes.JSONB, defaultValue: [] },
        // Sales pipeline: which staff member owns this lead, and when they should next follow up.
        assignedTo: { type: DataTypes.BIGINT, allowNull: true },
        assignedToName: { type: DataTypes.STRING, allowNull: true },
        followUpAt: { type: DataTypes.DATE, allowNull: true },
    }, {
        schema: 'crm',
        tableName: 'inquiries',
        underscored: true,
        timestamps: true,
    });
    Inquiry.LEAD_STATUSES = LEAD_STATUSES;
    return Inquiry;
};
