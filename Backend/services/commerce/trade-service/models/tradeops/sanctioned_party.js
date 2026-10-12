'use strict';
// Compliance & Sanctions Engine (Prompt 8) — sanctioned party / country registry.
// Schema `tradeops`, GLOBAL reference data (no tenant_id → skipped by the tenant
// hooks in models/index.js, like the shared `carriers` / `hs_codes` registries).
// Seeded from service/compliance/dataset.js by seedCompliance.js (single source
// of truth). Holds sanctioned countries plus restricted parties/entities/vessels.
module.exports = (sequelize, DataTypes) => {
    const SanctionedParty = sequelize.define('SanctionedParty', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        party_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'entity',
            validate: { isIn: [['country', 'entity', 'individual', 'vessel', 'organization']] },
        },
        name: { type: DataTypes.TEXT, allowNull: false },
        country: { type: DataTypes.TEXT },
        aliases: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
        program: { type: DataTypes.TEXT },
        list_source: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'platform' },
        severity: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'high',
            validate: { isIn: [['low', 'medium', 'high', 'critical']] },
        },
        notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        // Provenance for rows imported from the official lists (migration 088).
        source_id: { type: DataTypes.TEXT },
        source_list_date: { type: DataTypes.DATEONLY },
        last_seen_at: { type: DataTypes.DATE },
        delisted_at: { type: DataTypes.DATE },
    }, {
        schema: 'tradeops',
        tableName: 'compliance_sanctioned_parties',
        underscored: true,
        timestamps: true,
    });

    return SanctionedParty;
};
