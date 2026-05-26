'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_attribute_groups', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        slug: { type: DataTypes.STRING(100), allowNull: false },
        type: { type: DataTypes.ENUM('select', 'multi_select', 'text', 'number', 'boolean', 'color', 'size'), defaultValue: 'select' },
        isGlobal: { type: DataTypes.BOOLEAN, defaultValue: false },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, { schema: 'commerce', tableName: 'commerce_attribute_groups', underscored: true, timestamps: true, indexes: [{ fields: ['store_id'] }] });
};
