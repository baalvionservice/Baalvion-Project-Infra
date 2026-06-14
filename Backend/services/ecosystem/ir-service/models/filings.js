'use strict';
// Aligned to the live `ir.filings` table (file_url not document_url; varchar status;
// no accession_number column).
module.exports = (sequelize, DataTypes) => {
    const Filing = sequelize.define('Filing', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        created_by: { type: DataTypes.BIGINT },
        title: { type: DataTypes.STRING(500), allowNull: false },
        filing_type: { type: DataTypes.STRING, allowNull: false },
        regulator: { type: DataTypes.STRING(100) },
        filing_date: { type: DataTypes.DATEONLY },
        period_of_report: { type: DataTypes.DATEONLY },
        status: { type: DataTypes.STRING, defaultValue: 'filed' },
        file_url: { type: DataTypes.TEXT },
        external_url: { type: DataTypes.TEXT },
        description: { type: DataTypes.TEXT },
    }, {
        schema: 'ir',
        tableName: 'filings',
        underscored: true,
        timestamps: true,
    });
    return Filing;
};
