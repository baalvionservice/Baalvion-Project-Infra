'use strict';
module.exports = (sequelize, DataTypes) => {
    const Inspection = sequelize.define('Inspection', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id: { type: DataTypes.TEXT, allowNull: false },
        order_id: { type: DataTypes.TEXT },
        product_id: { type: DataTypes.TEXT },
        supplier_id: { type: DataTypes.TEXT },
        type: { type: DataTypes.ENUM('incoming', 'in_process', 'pre_shipment', 'container_loading'), allowNull: false },
        aql_level: { type: DataTypes.TEXT },
        status: { type: DataTypes.ENUM('scheduled', 'in_progress', 'passed', 'failed', 'cancelled'), defaultValue: 'scheduled' },
        inspector_id: { type: DataTypes.TEXT },
        scheduled_at: { type: DataTypes.DATE },
        result: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'quality', tableName: 'inspections', underscored: true, timestamps: true });
    Inspection.associate = (db) => {
        Inspection.hasMany(db.Defect, { foreignKey: 'inspection_id', as: 'defects' });
        Inspection.hasMany(db.Capa, { foreignKey: 'inspection_id', as: 'capa' });
    };
    return Inspection;
};
