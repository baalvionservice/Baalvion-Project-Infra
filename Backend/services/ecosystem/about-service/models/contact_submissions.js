'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ContactSubmission = sequelize.define('ContactSubmission', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        phone: { type: DataTypes.STRING(30), allowNull: true },
        subject: { type: DataTypes.STRING(500), allowNull: true },
        message: { type: DataTypes.TEXT, allowNull: false },
        inquiry_type: {
            type: DataTypes.STRING(100),
            defaultValue: 'general',
            validate: { isIn: [['general', 'support', 'partnership', 'press', 'careers']] }
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: 'new',
            validate: { isIn: [['new', 'read', 'responded', 'closed']] }
        },
        responded_at: { type: DataTypes.DATE, allowNull: true },
        response: { type: DataTypes.TEXT, allowNull: true },
        ip_address: { type: DataTypes.STRING(45), allowNull: true },
        user_agent: { type: DataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'contact_submissions',
        schema: 'about',
        underscored: true,
        timestamps: true,
    });
    return ContactSubmission;
};
