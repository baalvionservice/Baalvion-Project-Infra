'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('policy', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        tenant_id:   { type: DataTypes.UUID, allowNull: true },
        key:         { type: DataTypes.STRING(120), allowNull: false },
        name:        { type: DataTypes.STRING(160), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        effect:      { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'allow' },
        priority:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
        target:      { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        condition:   { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        obligations: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        status:      { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        version:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        created_by:  { type: DataTypes.STRING(64), allowNull: true },
    }, {
        sequelize, tableName: 'policies', schema: 'rbac', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['tenant_id', 'key'] }],
    });
};
