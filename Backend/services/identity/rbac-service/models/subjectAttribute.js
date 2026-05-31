'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('subject_attribute', {
        id:        { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id:   { type: DataTypes.STRING(64), allowNull: false },
        tenant_id: { type: DataTypes.UUID, allowNull: true },
        key:       { type: DataTypes.STRING(80), allowNull: false },
        value:     { type: DataTypes.JSONB, allowNull: false, defaultValue: null },
    }, {
        sequelize, tableName: 'subject_attributes', schema: 'rbac', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['user_id', 'tenant_id', 'key'] }],
    });
};
