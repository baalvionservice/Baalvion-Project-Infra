'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('inquiries', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        property_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'properties', schema: 'real_estate' }, key: 'id' } },
        agent_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: { tableName: 'agents', schema: 'real_estate' }, key: 'id' } },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        phone: { type: DataTypes.STRING(50), allowNull: true },
        message: { type: DataTypes.TEXT, allowNull: true },
        inquiry_type: { type: DataTypes.ENUM('general', 'viewing', 'offer', 'price'), defaultValue: 'general' },
        status: { type: DataTypes.ENUM('new', 'contacted', 'closed'), defaultValue: 'new' },
        response: { type: DataTypes.TEXT, allowNull: true },
        responded_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'inquiries',
        schema: 'real_estate',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['org_id'] },
            { fields: ['property_id'] },
            { fields: ['agent_id'] },
            { fields: ['user_id'] },
            { fields: ['status'] },
        ],
    });
};
