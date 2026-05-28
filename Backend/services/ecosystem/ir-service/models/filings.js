'use strict';
module.exports = (sequelize, DataTypes) => {
    const Filing = sequelize.define('Filing', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        filing_type: { type: DataTypes.STRING(100), allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        regulator: { type: DataTypes.STRING(100) },
        filing_date: { type: DataTypes.DATEONLY, allowNull: false },
        period_of_report: { type: DataTypes.DATEONLY },
        document_url: { type: DataTypes.STRING(500) },
        accession_number: { type: DataTypes.STRING(100) },
        status: {
            type: DataTypes.ENUM('filed', 'amended', 'withdrawn'),
            defaultValue: 'filed',
        },
        description: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.INTEGER },
    }, {
        schema: 'ir',
        tableName: 'filings',
        underscored: true,
        timestamps: true,
    });
    return Filing;
};
