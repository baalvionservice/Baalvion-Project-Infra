'use strict';
// Tasks module (Phase 1 Trade Agent workspace) — generic tenant-scoped to-do
// tracking with an optional polymorphic link to the entity it concerns.
// Schema `tradeops`, UUID PK, tenant-scoped (RLS + models/index.js hooks).
// See migration 021.
module.exports = (sequelize, DataTypes) => {
    const Task = sequelize.define('Task', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        assigned_to_user_id: { type: DataTypes.TEXT },
        assigned_to_org_id: { type: DataTypes.TEXT },
        created_by_user_id: { type: DataTypes.TEXT },
        related_entity_type: { type: DataTypes.TEXT },
        related_entity_id: { type: DataTypes.TEXT },
        title: { type: DataTypes.TEXT, allowNull: false },
        description: { type: DataTypes.TEXT },
        category: { type: DataTypes.TEXT },
        priority: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'medium',
            validate: { isIn: [['low', 'medium', 'high', 'urgent']] },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'open',
            validate: { isIn: [['open', 'in_progress', 'completed', 'cancelled']] },
        },
        due_date: { type: DataTypes.DATE },
        completed_at: { type: DataTypes.DATE },
    }, {
        schema: 'tradeops',
        tableName: 'tasks',
        underscored: true,
        timestamps: true,
    });

    return Task;
};
