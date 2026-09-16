'use strict';
// FX rate lock (Compression, Phase 5). Schema `tradeops`, tenant-scoped. The rate
// is stored as a SCALED INTEGER (rate_scaled / 10^rate_decimals), never a float:
// converting between currencies with different minor units drifts in floating
// point, and a duty payment one unit off the assessment is refused at the
// authority. An expired lock is an error at settlement, not a silent re-quote.
// See migration 082 + service/duty/fx.js.
module.exports = (sequelize, DataTypes) => {
    const FxLock = sequelize.define('FxLock', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        consignment_id: { type: DataTypes.UUID },
        base_currency: { type: DataTypes.TEXT, allowNull: false },
        quote_currency: { type: DataTypes.TEXT, allowNull: false },
        // NUMERIC(40,0) — read back as a string so no precision is lost crossing
        // the driver boundary; service/duty/fx.js parses it straight into BigInt.
        rate_scaled: { type: DataTypes.DECIMAL(40, 0), allowNull: false },
        rate_decimals: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
        source: { type: DataTypes.TEXT },
        locked_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'active',
            validate: { isIn: [['active', 'consumed', 'expired', 'cancelled']] },
        },
        consumed_at: { type: DataTypes.DATE },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'fx_locks',
        underscored: true,
        timestamps: true,
    });

    return FxLock;
};
