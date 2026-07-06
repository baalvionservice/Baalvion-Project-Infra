'use strict';
// Risk Assessment Engine — append-only history of org-level risk scoring runs
// (Phase 2 Trust/Verification/Compliance Foundation, migration 035). is_current
// marks the latest row per org (partial unique index).
module.exports = (sequelize, DataTypes) => {
    const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

    const OrgRiskAssessment = sequelize.define('OrgRiskAssessment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        risk_level: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [RISK_LEVELS] } },
        score: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
        factors: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        schema: 'tradeops',
        tableName: 'org_risk_assessments',
        underscored: true,
        timestamps: false,
    });

    OrgRiskAssessment.RISK_LEVELS = RISK_LEVELS;

    OrgRiskAssessment.associate = (db) => {
        OrgRiskAssessment.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
    };

    return OrgRiskAssessment;
};
