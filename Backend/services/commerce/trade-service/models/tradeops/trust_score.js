'use strict';
// Trust Score Engine — append-only history of the 0-100 composite trust score
// (Phase 2 Trust/Verification/Compliance Foundation, migration 036). is_current
// marks the latest row per org.
module.exports = (sequelize, DataTypes) => {
    const TrustScore = sequelize.define('TrustScore', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 100 } },
        breakdown: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        schema: 'tradeops',
        tableName: 'trust_scores',
        underscored: true,
        timestamps: false,
    });

    TrustScore.associate = (db) => {
        TrustScore.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
    };

    return TrustScore;
};
