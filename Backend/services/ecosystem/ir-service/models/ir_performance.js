'use strict';
// Institutional performance snapshot (singleton per org): NAV history, IRR metrics, SPV
// performance, capital timeline. Read by the dashboard performance hook + admin performance page.
module.exports = (sequelize, DataTypes) => {
    const IrPerformance = sequelize.define('IrPerformance', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false, unique: true },
        nav_history: { type: DataTypes.JSONB, defaultValue: [] },
        metrics: { type: DataTypes.JSONB, defaultValue: {} },
        spv_performance: { type: DataTypes.JSONB, defaultValue: [] },
        capital_timeline: { type: DataTypes.JSONB, defaultValue: [] },
        documents: { type: DataTypes.JSONB, defaultValue: [] },
    }, { schema: 'ir', tableName: 'ir_performance', underscored: true, timestamps: true });
    return IrPerformance;
};
