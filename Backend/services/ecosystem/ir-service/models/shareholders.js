'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Shareholder = sequelize.define('Shareholder', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(500), allowNull: false },
        type: {
            type: DataTypes.STRING(50),
            defaultValue: 'institutional',
            validate: { isIn: [['institutional', 'retail', 'insider', 'mutual_fund']] }
        },
        shares_held: { type: DataTypes.BIGINT, allowNull: false },
        ownership_pct: { type: DataTypes.DECIMAL(8, 4), allowNull: false },
        as_of_date: { type: DataTypes.DATEONLY, allowNull: false },
        country: { type: DataTypes.STRING(100), allowNull: true },
        change_from_prev: { type: DataTypes.BIGINT, defaultValue: 0 },
        change_pct: { type: DataTypes.DECIMAL(8, 4), defaultValue: 0 },
    }, {
        tableName: 'shareholders',
        schema: 'ir',
        underscored: true,
        timestamps: true,
    });
    return Shareholder;
};
