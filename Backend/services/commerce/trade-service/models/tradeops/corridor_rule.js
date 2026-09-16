'use strict';
// Corridor requirement rule (Compression, Phase 2) — GLOBAL reference data, no
// tenant_id (like HsCode / ComplianceRule), so it belongs in TENANT_EXCLUDED.
// What a jurisdiction requires on a declaration is a public fact, not customer
// data. Rows here EXTEND the built-in ruleset in service/corridor/matrix.js, so a
// corridor can be taught a new requirement without a deploy. See migration 080.
module.exports = (sequelize, DataTypes) => {
    const CorridorRule = sequelize.define('CorridorRule', {
        id: { type: DataTypes.TEXT, primaryKey: true },
        scope: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'both',
            validate: { isIn: [['import', 'export', 'both']] },
        },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
        when_clause: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        requires: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        severity: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'blocking',
            validate: { isIn: [['blocking', 'warning']] },
        },
        reason: { type: DataTypes.TEXT },
        adds_floor_hours: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        source: { type: DataTypes.TEXT },       // where the requirement is published
        effective_from: { type: DataTypes.DATEONLY },
        effective_to: { type: DataTypes.DATEONLY },
    }, {
        schema: 'tradeops',
        tableName: 'corridor_rules',
        underscored: true,
        timestamps: true,
    });

    return CorridorRule;
};
