'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('tenant', {
        id:           { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        type:         { type: DataTypes.STRING(20), allowNull: false },
        parent_id:    { type: DataTypes.UUID, allowNull: true },
        external_ref: { type: DataTypes.STRING(128), allowNull: true },
        name:         { type: DataTypes.STRING(255), allowNull: false },
        slug:         { type: DataTypes.STRING(160), allowNull: false, unique: true },
        status:       { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        attributes:   { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        metadata:     { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by:   { type: DataTypes.STRING(64), allowNull: true },
    }, {
        sequelize, tableName: 'tenants', schema: 'rbac', timestamps: true, underscored: true,
    });
};
