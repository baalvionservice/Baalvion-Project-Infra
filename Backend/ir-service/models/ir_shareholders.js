'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrShareholder = sequelize.define('IrShareholder', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(300), allowNull: false },
        type: {
            type: DataTypes.ENUM('institutional', 'retail', 'insider', 'mutual_fund', 'etf'),
            defaultValue: 'retail',
        },
        holding_pct: { type: DataTypes.DECIMAL(6, 4), defaultValue: 0 },
        shares_held: { type: DataTypes.BIGINT, defaultValue: 0 },
        value_usd: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
        change_pct: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
        country: { type: DataTypes.STRING(100) },
        as_of_date: { type: DataTypes.DATEONLY },
    }, {
        schema: 'ir',
        tableName: 'ir_shareholders',
        underscored: true,
        timestamps: true,
    });
    return IrShareholder;
};
