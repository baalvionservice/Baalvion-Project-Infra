'use strict';
module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define('Report', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        report_type: {
            type: DataTypes.ENUM('annual', 'quarterly', 'interim', 'sustainability', 'proxy'),
            allowNull: false,
        },
        fiscal_year: { type: DataTypes.INTEGER },
        fiscal_quarter: { type: DataTypes.INTEGER },
        period_start: { type: DataTypes.DATEONLY },
        period_end: { type: DataTypes.DATEONLY },
        status: {
            type: DataTypes.ENUM('draft', 'review', 'published'),
            defaultValue: 'draft',
        },
        summary: { type: DataTypes.TEXT },
        highlights: { type: DataTypes.JSONB, defaultValue: [] },
        document_url: { type: DataTypes.STRING(500) },
        cover_image: { type: DataTypes.STRING(500) },
        downloads_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        published_at: { type: DataTypes.DATE },
        created_by: { type: DataTypes.INTEGER },
    }, {
        schema: 'ir',
        tableName: 'reports',
        underscored: true,
        timestamps: true,
    });
    return Report;
};
