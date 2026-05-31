'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('api_spec', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        service:     { type: DataTypes.STRING(80), allowNull: false },   // owning service name
        title:       { type: DataTypes.STRING(160), allowNull: false },
        version:     { type: DataTypes.STRING(32), allowNull: false, defaultValue: '1.0.0' },
        spec:        { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }, // OpenAPI document
        is_public:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        status:      { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        created_by:  { type: DataTypes.STRING(64), allowNull: true },
        created_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'api_specs', schema: 'developer', timestamps: false,
        indexes: [{ unique: true, fields: ['service', 'version'] }, { fields: ['is_public'] }],
    });
};
