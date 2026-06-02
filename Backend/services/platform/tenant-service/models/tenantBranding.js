'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('tenant_branding', {
        id:             { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        tenant_id:      { type: DataTypes.UUID, allowNull: false },
        app:            { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'default' }, // per-app branding ('default' = base)
        brand_name:     { type: DataTypes.STRING(160), allowNull: true },
        logo_url:       { type: DataTypes.TEXT, allowNull: true },
        logo_dark_url:  { type: DataTypes.TEXT, allowNull: true },
        favicon_url:    { type: DataTypes.TEXT, allowNull: true },
        primary_color:  { type: DataTypes.STRING(16), allowNull: true },
        secondary_color:{ type: DataTypes.STRING(16), allowNull: true },
        accent_color:   { type: DataTypes.STRING(16), allowNull: true },
        login_bg_url:   { type: DataTypes.TEXT, allowNull: true },
        custom_css:     { type: DataTypes.TEXT, allowNull: true },
        support_email:  { type: DataTypes.STRING(160), allowNull: true },
        support_url:    { type: DataTypes.TEXT, allowNull: true },
        email_from:     { type: DataTypes.STRING(160), allowNull: true },
        theme:          { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }, // arbitrary design tokens
        enabled:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        updated_at:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'tenant_branding', schema: 'tenant', timestamps: false,
        indexes: [{ unique: true, fields: ['tenant_id', 'app'] }],
    });
};
