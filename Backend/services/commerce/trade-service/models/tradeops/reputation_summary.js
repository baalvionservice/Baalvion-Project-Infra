'use strict';
// Reputation System — denormalized per-org-per-role aggregate (Phase 2 Trust/
// Verification/Compliance Foundation, migration 037). This is what
// service/verification/trustScore.js's feedback component reads.
module.exports = (sequelize, DataTypes) => {
    const ROLES = ['buyer', 'seller', 'agent'];

    const ReputationSummary = sequelize.define('ReputationSummary', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        role: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [ROLES] } },
        avg_rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
        total_ratings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        completed_orders: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        avg_response_time: { type: DataTypes.INTEGER },
        dispute_rate: { type: DataTypes.DECIMAL(5, 4), allowNull: false, defaultValue: 0 },
        computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        schema: 'tradeops',
        tableName: 'reputation_summaries',
        underscored: true,
        timestamps: false,
    });

    ReputationSummary.ROLES = ROLES;

    ReputationSummary.associate = (db) => {
        ReputationSummary.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
    };

    return ReputationSummary;
};
