'use strict';
module.exports = (sequelize, DataTypes) => {
    const Organization = sequelize.define('Organization', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false },
        // Stable external code (e.g. 'COMP-101') the frontend addresses orgs by.
        code: { type: DataTypes.STRING(64), unique: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        type: {
            type: DataTypes.ENUM('buyer', 'seller', 'carrier', 'bank', 'insurer', 'regulator'),
        },
        country: { type: DataTypes.STRING(100) },
        registration_number: { type: DataTypes.STRING(100) },
        status: {
            type: DataTypes.ENUM('active', 'suspended', 'pending'),
            defaultValue: 'pending',
        },
        contact_email: { type: DataTypes.STRING },
        kyc_status: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending',
        },
        risk_score: { type: DataTypes.DECIMAL(5, 2) },
        // Frontend reads org.verificationStatus; mirror kyc_status into the JSON.
        verificationStatus: {
            type: DataTypes.VIRTUAL,
            get() { return this.getDataValue('kyc_status'); },
        },
    }, {
        schema: 'trade',
        tableName: 'organizations',
        underscored: true,
        timestamps: true,
    });

    Organization.associate = (db) => {
        Organization.hasMany(db.Rfq, { foreignKey: 'buyer_org_id', as: 'rfqs' });
        Organization.hasOne(db.Wallet, { foreignKey: 'org_id', as: 'wallet' });
    };

    return Organization;
};
