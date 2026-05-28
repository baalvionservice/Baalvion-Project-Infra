'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_store_members', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        userId: { type: DataTypes.BIGINT, allowNull: false },
        role: { type: DataTypes.ENUM('store_admin', 'commerce_manager', 'inventory_manager', 'seo_manager', 'fulfillment_manager', 'support_agent', 'content_editor', 'reviewer'), allowNull: false },
        invitedBy: { type: DataTypes.BIGINT, allowNull: true },
        joinedAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'commerce', tableName: 'commerce_store_members', underscored: true, timestamps: true, indexes: [{ unique: true, fields: ['store_id', 'user_id'] }] });
};
