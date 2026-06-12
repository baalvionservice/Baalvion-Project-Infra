'use strict';
// Aligned to the live `ir.reports` table and the API validator (validators/schemas.js).
// The table uses period_year/period_quarter (not fiscal_*), file_url (not document_url),
// and stores report_type/status as varchar (not PG enums), so they are modelled as
// STRING here. Keeping this model in lockstep with the table is what makes
// create/update/publish work.
module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define('Report', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        created_by: { type: DataTypes.BIGINT },
        title: { type: DataTypes.STRING(500), allowNull: false },
        report_type: { type: DataTypes.STRING, allowNull: false },
        period_quarter: { type: DataTypes.INTEGER },
        period_year: { type: DataTypes.INTEGER },
        summary: { type: DataTypes.TEXT },
        highlights: { type: DataTypes.JSONB, defaultValue: [] },
        revenue: { type: DataTypes.DECIMAL },
        net_income: { type: DataTypes.DECIMAL },
        eps: { type: DataTypes.DECIMAL },
        revenue_growth_pct: { type: DataTypes.DECIMAL },
        status: { type: DataTypes.STRING, defaultValue: 'draft' },
        file_url: { type: DataTypes.TEXT },
        downloads_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        published_at: { type: DataTypes.DATE },
    }, {
        schema: 'ir',
        tableName: 'reports',
        underscored: true,
        timestamps: true,
    });
    return Report;
};
