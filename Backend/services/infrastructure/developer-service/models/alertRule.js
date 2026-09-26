'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('alert_rule', {
        id:                { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id:            { type: DataTypes.STRING(128), allowNull: false },
        label:             { type: DataTypes.STRING(160), allowNull: false },
        condition_type:    { type: DataTypes.STRING(16), allowNull: false }, // keyword|category|country|sentiment|entity
        condition_value:   { type: DataTypes.STRING(200), allowNull: false },
        webhook_url:       { type: DataTypes.TEXT, allowNull: false },
        webhook_secret:    { type: DataTypes.STRING(80), allowNull: false },
        active:            { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        last_triggered_at: { type: DataTypes.DATE, allowNull: true },
        trigger_count:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        created_by:        { type: DataTypes.STRING(64), allowNull: true },
        created_at:        { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at:        { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'alert_rules', schema: 'developer', timestamps: false,
        indexes: [{ fields: ['org_id'] }, { fields: ['active'] }],
    });
};
