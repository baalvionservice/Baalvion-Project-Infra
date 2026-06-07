'use strict';
// Manual stock/market snapshot (singleton per org). Admin-entered until a live feed is
// wired; the public stock widget renders from this row.
module.exports = (sequelize, DataTypes) => {
    const MarketSnapshot = sequelize.define('MarketSnapshot', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false, unique: true },
        symbol: { type: DataTypes.STRING(20) },
        exchange: { type: DataTypes.STRING(50) },
        price: { type: DataTypes.DECIMAL },
        currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
        change_pct: { type: DataTypes.DECIMAL },
        market_cap: { type: DataTypes.DECIMAL },
        volume: { type: DataTypes.BIGINT },
        week52_high: { type: DataTypes.DECIMAL },
        week52_low: { type: DataTypes.DECIMAL },
        pe_ratio: { type: DataTypes.DECIMAL },
        dividend_yield: { type: DataTypes.DECIMAL },
        dividend_per_share: { type: DataTypes.DECIMAL },
        as_of: { type: DataTypes.DATE },
    }, {
        schema: 'ir',
        tableName: 'market_snapshot',
        underscored: true,
        timestamps: true,
    });
    return MarketSnapshot;
};
