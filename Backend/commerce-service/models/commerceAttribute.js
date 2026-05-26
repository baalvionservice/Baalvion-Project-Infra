'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_attributes', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        groupId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_attribute_groups', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        value: { type: DataTypes.STRING(200), allowNull: false },
        label: { type: DataTypes.STRING(200), allowNull: false },
        colorHex: { type: DataTypes.STRING(7), allowNull: true },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, { schema: 'commerce', tableName: 'commerce_attributes', underscored: true, timestamps: true, indexes: [{ fields: ['group_id'] }] });
};
