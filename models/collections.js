'use strict';
module.exports = (sequelize, DataTypes) => {
    // A generic document store: one row per document, keyed by `collection`.
    // Backs the long-tail resources (alerts, risk_signals, contracts, policies,
    // ledger_entries, ...) that don't warrant a bespoke typed table yet, so the
    // frontend talks to a real persisted API instead of returning mock data.
    const Collection = sequelize.define('Collection', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenantId: { type: DataTypes.STRING, defaultValue: 'T-DEMO' },
        collection: { type: DataTypes.STRING(120), allowNull: false },
        data: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'collections',
        underscored: false,
        timestamps: true,
        indexes: [{ fields: ['collection'] }],
    });

    return Collection;
};
