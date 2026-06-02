'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('role', {
        id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        tenant_id:      { type: DataTypes.UUID, allowNull: false },
        key:            { type: DataTypes.STRING(64), allowNull: false },
        name:           { type: DataTypes.STRING(128), allowNull: false },
        description:    { type: DataTypes.TEXT, allowNull: true },
        scope_type:     { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'organization' },
        level:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
        parent_role_id: { type: DataTypes.UUID, allowNull: true },
        is_system:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        is_assignable:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        status:         { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        attributes:     { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        metadata:       { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by:     { type: DataTypes.STRING(64), allowNull: true },
    }, {
        sequelize, tableName: 'roles', schema: 'rbac', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['tenant_id', 'key'] }],
    });
};
