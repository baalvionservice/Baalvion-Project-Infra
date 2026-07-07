'use strict';
// Warehouse Management System, Phase A — the persisted output of the
// rule-based putaway engine (service/warehouse/putaway/*): a suggested bin for
// a received line item, which a worker accepts or manually overrides.
// pending -> suggested -> assigned -> completed (or cancelled). Plain
// timestamps + optimistic-locking version, same rationale as RouteOptimization.
module.exports = (sequelize, DataTypes) => {
    const PutawayTask = sequelize.define('PutawayTask', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        warehouse_id: { type: DataTypes.UUID, allowNull: false },
        grn_line_id: { type: DataTypes.UUID },
        package_id: { type: DataTypes.UUID },
        suggested_bin_id: { type: DataTypes.UUID },
        assigned_bin_id: { type: DataTypes.UUID },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'suggested', 'assigned', 'completed', 'cancelled']] },
        },
        strategy: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'rule_based',
            validate: { isIn: [['rule_based', 'manual_override']] },
        },
        quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
        unit: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'unit' },
        reason_codes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        override_reason: { type: DataTypes.TEXT },
        assigned_by: { type: DataTypes.TEXT },
        assigned_at: { type: DataTypes.DATE },
        completed_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'putaway_tasks',
        underscored: true,
        timestamps: true,
        version: true,
    });

    PutawayTask.associate = (db) => {
        PutawayTask.belongsTo(db.Warehouse, { as: 'warehouse', foreignKey: 'warehouse_id' });
        PutawayTask.belongsTo(db.GoodsReceiptLine, { as: 'grnLine', foreignKey: 'grn_line_id' });
        PutawayTask.belongsTo(db.LogisticsPackage, { as: 'package', foreignKey: 'package_id' });
        PutawayTask.belongsTo(db.WarehouseBin, { as: 'suggestedBin', foreignKey: 'suggested_bin_id' });
        PutawayTask.belongsTo(db.WarehouseBin, { as: 'assignedBin', foreignKey: 'assigned_bin_id' });
    };

    return PutawayTask;
};
