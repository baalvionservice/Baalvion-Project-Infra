'use strict';
// A customer segment used by the marketing console (cohort sizing, targeting, churn).
module.exports = (sequelize, DataTypes) => {
    const Segment = sequelize.define('Segment', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        userCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        avgOrderValue: { type: DataTypes.DECIMAL, defaultValue: 0 },
        tags: { type: DataTypes.JSONB, defaultValue: [] },
        predictedChurn: { type: DataTypes.DECIMAL, defaultValue: 0 },
    }, {
        schema: 'crm',
        tableName: 'segments',
        underscored: true,
        timestamps: true,
    });
    return Segment;
};
