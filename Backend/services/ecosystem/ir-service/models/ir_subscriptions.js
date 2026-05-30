'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrSubscription = sequelize.define('IrSubscription', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        role: { type: DataTypes.STRING(64), allowNull: false },
        email: { type: DataTypes.STRING(320), allowNull: false },
        preferences: { type: DataTypes.JSONB, defaultValue: { News: true, Governance: true, Voting: true, DataRoom: true } },
        active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, { schema: 'ir', tableName: 'ir_subscriptions', underscored: true, timestamps: true });
    return IrSubscription;
};
