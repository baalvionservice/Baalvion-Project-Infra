'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrInvestorApplication = sequelize.define('IrInvestorApplication', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        reference: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        full_name: { type: DataTypes.STRING(200), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        entity: { type: DataTypes.STRING(300) },
        investor_type: { type: DataTypes.STRING(60) },
        accredited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        commitment: { type: DataTypes.DECIMAL(18, 2) },
        message: { type: DataTypes.TEXT },
        // VARCHAR in the DB (not a pg enum) — validated at the schema layer.
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pending',
        },
        review_note: { type: DataTypes.TEXT },
        reviewed_by: { type: DataTypes.STRING(120) },
        reviewed_at: { type: DataTypes.DATE },
    }, {
        schema: 'ir',
        tableName: 'ir_investor_applications',
        underscored: true,
        timestamps: true,
    });
    return IrInvestorApplication;
};
