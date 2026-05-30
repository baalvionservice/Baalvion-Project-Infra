'use strict';
// Admin-generated cross-module reports (governance reviews, audit exports). Distinct from the
// investor-facing `reports` resource (annual/quarterly IR filings).
module.exports = (sequelize, DataTypes) => {
    const IrGeneratedReport = sequelize.define('IrGeneratedReport', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        report_type: { type: DataTypes.STRING(48) },          // Governance | Performance | Audit | ...
        date_range: { type: DataTypes.JSONB, defaultValue: {} },
        included_modules: { type: DataTypes.JSONB, defaultValue: [] },
        generated_by_role: { type: DataTypes.STRING(64) },
        status: { type: DataTypes.STRING(32), defaultValue: 'Draft' },   // Draft | Generated | Archived
        generated_at: { type: DataTypes.DATE },
        export_format: { type: DataTypes.STRING(16), defaultValue: 'PDF' },
        data_snapshot: { type: DataTypes.JSONB, defaultValue: {} },
        version_history: { type: DataTypes.JSONB, defaultValue: [] },
        created_by: { type: DataTypes.INTEGER },
    }, { schema: 'ir', tableName: 'ir_generated_reports', underscored: true, timestamps: true });
    return IrGeneratedReport;
};
