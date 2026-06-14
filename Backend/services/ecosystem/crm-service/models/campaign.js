'use strict';
// A marketing campaign (flash sale, launch, email) with performance + AI-predicted ROI.
module.exports = (sequelize, DataTypes) => {
    const Campaign = sequelize.define('Campaign', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, defaultValue: 'Email' },
        status: { type: DataTypes.STRING, defaultValue: 'scheduled' },
        discountValue: { type: DataTypes.DECIMAL, defaultValue: 0 },
        startDate: { type: DataTypes.DATEONLY },
        endDate: { type: DataTypes.DATEONLY },
        market: { type: DataTypes.STRING, defaultValue: 'global' },
        reach: { type: DataTypes.INTEGER, defaultValue: 0 },
        conversions: { type: DataTypes.INTEGER, defaultValue: 0 },
        roi: { type: DataTypes.DECIMAL, defaultValue: 0 },
        predictedRoi: { type: DataTypes.DECIMAL, defaultValue: 0 },
        abTestActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
        schema: 'crm',
        tableName: 'campaigns',
        underscored: true,
        timestamps: true,
    });
    return Campaign;
};
