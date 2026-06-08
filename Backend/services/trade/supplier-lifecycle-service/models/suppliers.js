'use strict';
module.exports = (sequelize, DataTypes) => {
    const Supplier = sequelize.define('Supplier', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id: { type: DataTypes.TEXT, allowNull: false },
        legal_name: { type: DataTypes.TEXT, allowNull: false },
        country: { type: DataTypes.CHAR(2), allowNull: false },
        stage: {
            type: DataTypes.ENUM('prospect', 'onboarding', 'qualified', 'active', 'suspended', 'offboarded', 'blacklisted'),
            defaultValue: 'prospect',
        },
        risk_score: { type: DataTypes.DECIMAL(5, 2) },
        trust_score: { type: DataTypes.INTEGER },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'supplier', tableName: 'suppliers', underscored: true, timestamps: true });
    Supplier.associate = (db) => {
        Supplier.hasMany(db.QualificationDoc, { foreignKey: 'supplier_id', as: 'qualificationDocs' });
        Supplier.hasMany(db.Scorecard, { foreignKey: 'supplier_id', as: 'scorecards' });
    };
    return Supplier;
};
