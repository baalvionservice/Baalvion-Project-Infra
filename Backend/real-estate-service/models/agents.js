'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('agents', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        phone: { type: DataTypes.STRING(50), allowNull: true },
        avatar_url: { type: DataTypes.STRING(500), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        specialization: { type: DataTypes.JSONB, defaultValue: [] },
        license_number: { type: DataTypes.STRING(100), allowNull: true },
        license_expiry: { type: DataTypes.DATEONLY, allowNull: true },
        languages: { type: DataTypes.JSONB, defaultValue: [] },
        rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
        review_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        active_listings: { type: DataTypes.INTEGER, defaultValue: 0 },
        deals_closed: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    }, {
        tableName: 'agents',
        schema: 'real_estate',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['org_id'] },
            { fields: ['status'] },
            { fields: ['email'] },
        ],
    });
};
