'use strict';
// Freight Management — Carrier Directory (Phase 3, Prompt 2). Schema `tradeops`,
// GLOBAL reference data (no tenant_id → skipped by the tenant hooks in
// models/index.js, like HsCode). Registered as `CarrierDirectory` in models/index.js
// to avoid colliding with the legacy `db.Carrier` (schema `trade`, string PK,
// read-only shim behind /v1/carriers — kept live, not replaced).
//
// The DYNAMIC source of truth for carrier metadata: replaces the hardcoded
// CARRIER_PROFILES object (service/freight/schema.js) and per-connector RATE_CARD
// constants. `connector_key` maps to a registered connector in
// service/freight/connectors/index.js; when null (or unmatched) the marketplace
// falls back to the generic/manual connector so any carrier works without bespoke
// integration code. See migration 047.
module.exports = (sequelize, DataTypes) => {
    const Carrier = sequelize.define('CarrierDirectory', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        code: { type: DataTypes.TEXT, allowNull: false, unique: true },
        name: { type: DataTypes.TEXT, allowNull: false },
        logo_url: { type: DataTypes.TEXT },
        country: { type: DataTypes.TEXT },
        connector_key: { type: DataTypes.TEXT },
        credential_env_prefix: { type: DataTypes.TEXT },
        services: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        coverage: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        fleet: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        modes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 4.5 },
        reliability_score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 90 },
        insurance: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        certifications: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        tracking_api_supported: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        booking_api_supported: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        pricing_api_supported: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        availability_status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'limited', 'inactive']] },
        },
        operating_regions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        support_contact: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        documents: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'suspended', 'inactive']] },
        },
        performance_score: { type: DataTypes.DECIMAL(5, 2) },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'carriers',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
    });

    Carrier.associate = (db) => {
        Carrier.hasMany(db.CarrierService, { as: 'carrierServices', foreignKey: 'carrier_id' });
        Carrier.hasMany(db.CarrierRegion, { as: 'carrierRegions', foreignKey: 'carrier_id' });
        Carrier.hasMany(db.CarrierPerformance, { as: 'performanceHistory', foreignKey: 'carrier_id' });
    };

    return Carrier;
};
