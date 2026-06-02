'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commission_plan', {
        id:            { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id:        { type: DataTypes.STRING(128), allowNull: true },
        name:          { type: DataTypes.STRING(160), allowNull: false },
        type:          { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'percent' }, // flat|percent|tiered
        rate:          { type: DataTypes.DECIMAL(8, 5), allowNull: false, defaultValue: 0 }, // percent (0.10) or flat amount
        // tiered: [{ minAmount, rate }] picked by sale amount (highest min ≤ amount)
        tiers:         { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        recurring_pct: { type: DataTypes.DECIMAL(8, 5), allowNull: false, defaultValue: 0 }, // recurring/renewal commission
        // override % paid to each ancestor level on a sale, e.g. [0.05, 0.02]
        override_pcts: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        currency:      { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'USD' },
        status:        { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        created_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'commission_plans', schema: 'agent', timestamps: false,
        indexes: [{ fields: ['org_id'] }],
    });
};
