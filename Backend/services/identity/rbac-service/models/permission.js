'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('permission', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        key:         { type: DataTypes.STRING(160), allowNull: false, unique: true },
        resource:    { type: DataTypes.STRING(120), allowNull: false },
        action:      { type: DataTypes.STRING(60), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        module:      { type: DataTypes.STRING(60), allowNull: true },
        is_system:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        attributes:  { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        metadata:    { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        sequelize, tableName: 'permissions', schema: 'rbac', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['resource', 'action'] }],
    });
};
