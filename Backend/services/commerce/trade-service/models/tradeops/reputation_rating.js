'use strict';
// Reputation System — append-only individual ratings (Phase 2 Trust/Verification/
// Compliance Foundation, migration 037).
module.exports = (sequelize, DataTypes) => {
    const ROLES = ['buyer', 'seller', 'agent'];

    const ReputationRating = sequelize.define('ReputationRating', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        rater_org_id: { type: DataTypes.INTEGER },
        rater_user_id: { type: DataTypes.INTEGER },
        ratee_org_id: { type: DataTypes.INTEGER, allowNull: false },
        role: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [ROLES] } },
        order_id: { type: DataTypes.UUID },
        rating_value: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1, max: 5 } },
        response_time_seconds: { type: DataTypes.INTEGER },
        dispute_outcome: { type: DataTypes.TEXT },
        comment: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'reputation_ratings',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    ReputationRating.ROLES = ROLES;

    ReputationRating.associate = (db) => {
        ReputationRating.belongsTo(db.Organization, { as: 'ratee', foreignKey: 'ratee_org_id', constraints: false });
        ReputationRating.belongsTo(db.Organization, { as: 'rater', foreignKey: 'rater_org_id', constraints: false });
    };

    return ReputationRating;
};
