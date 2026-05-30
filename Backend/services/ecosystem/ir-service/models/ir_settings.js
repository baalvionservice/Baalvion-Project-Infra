'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrSetting = sequelize.define('IrSetting', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false, unique: true },
        branding: { type: DataTypes.JSONB, defaultValue: { companyName: 'Baalvion', logoUrl: '/logo.png' } },
        seo: { type: DataTypes.JSONB, defaultValue: { defaultTitle: 'Baalvion | Investor Relations', defaultDescription: '' } },
        features: {
            type: DataTypes.JSONB,
            defaultValue: {
                enableRegistration: true, enableDataRoomWatermark: true, maintenanceMode: false,
                freezePublishing: false, autoNotifyEnabled: true, autoSendEnabled: false,
            },
        },
        environment: { type: DataTypes.STRING(32), defaultValue: 'production' },
    }, { schema: 'ir', tableName: 'ir_settings', underscored: true, timestamps: true });
    return IrSetting;
};
