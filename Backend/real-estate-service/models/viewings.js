'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('viewings', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        property_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'properties', schema: 'real_estate' }, key: 'id' } },
        agent_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: { tableName: 'agents', schema: 'real_estate' }, key: 'id' } },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        user_name: { type: DataTypes.STRING(200), allowNull: true },
        user_email: { type: DataTypes.STRING(255), allowNull: true },
        user_phone: { type: DataTypes.STRING(50), allowNull: true },
        scheduled_at: { type: DataTypes.DATE, allowNull: false },
        duration_min: { type: DataTypes.INTEGER, defaultValue: 60 },
        notes: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'), defaultValue: 'pending' },
        feedback: { type: DataTypes.TEXT, allowNull: true },
        rating: { type: DataTypes.INTEGER, allowNull: true },
    }, {
        tableName: 'viewings',
        schema: 'real_estate',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['org_id'] },
            { fields: ['property_id'] },
            { fields: ['agent_id'] },
            { fields: ['user_id'] },
            { fields: ['status'] },
            { fields: ['scheduled_at'] },
        ],
    });
};
