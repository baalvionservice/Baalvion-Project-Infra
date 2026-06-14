'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('Scorecard', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    org_id: { type: DataTypes.TEXT, allowNull: false },
    supplier_id: { type: DataTypes.UUID, allowNull: false },
    period: { type: DataTypes.TEXT, allowNull: false },
    quality_kpi: { type: DataTypes.DECIMAL(5, 2) },
    otd_kpi: { type: DataTypes.DECIMAL(5, 2) },
    defect_ppm: { type: DataTypes.INTEGER },
    composite: { type: DataTypes.DECIMAL(5, 2) },
}, { schema: 'supplier', tableName: 'scorecards', underscored: true, timestamps: true });
