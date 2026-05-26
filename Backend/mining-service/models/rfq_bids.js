'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RfqBid = sequelize.define('RfqBid', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        rfq_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: { model: { tableName: 'rfqs', schema: 'mining' }, key: 'id' },
            onDelete: 'CASCADE',
        },
        seller_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        price_per_unit: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(10),
            defaultValue: 'USD',
        },
        quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: false,
        },
        lead_time_days: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: 'submitted',
            validate: { isIn: [['submitted', 'accepted', 'rejected', 'withdrawn']] },
        },
        valid_until: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    }, {
        tableName: 'rfq_bids',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    return RfqBid;
};
