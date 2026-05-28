'use strict';

module.exports = (sequelize, DataTypes) => {
    const CompanyVerification = sequelize.define('CompanyVerification', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: false, unique: true },
        company_name: { type: DataTypes.STRING(200), allowNull: true },
        registration_number: { type: DataTypes.STRING(100), allowNull: true },
        country: { type: DataTypes.STRING(100), allowNull: true },
        documents: { type: DataTypes.JSONB, defaultValue: [] },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'verified', 'rejected']] },
        },
        verified_by: { type: DataTypes.INTEGER, allowNull: true },
        verified_at: { type: DataTypes.DATE, allowNull: true },
        rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'company_verifications',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    CompanyVerification.associate = () => {};

    return CompanyVerification;
};
