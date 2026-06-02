'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('event_type', {
        name:        { type: DataTypes.STRING(120), primaryKey: true },
        category:    { type: DataTypes.STRING(60), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        sample:      { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'event_types', schema: 'developer', timestamps: false,
    });
};
