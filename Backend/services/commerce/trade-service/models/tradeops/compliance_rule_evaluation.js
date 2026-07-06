'use strict';
// Compliance Engine — append-only audit of rule evaluation runs (Phase 2
// Trust/Verification/Compliance Foundation, migration 033).
module.exports = (sequelize, DataTypes) => {
    const ComplianceRuleEvaluation = sequelize.define('ComplianceRuleEvaluation', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        rule_id: { type: DataTypes.UUID, allowNull: false },
        passed: { type: DataTypes.BOOLEAN, allowNull: false },
        details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        evaluated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        schema: 'tradeops',
        tableName: 'compliance_rule_evaluations',
        underscored: true,
        timestamps: false,
    });

    ComplianceRuleEvaluation.associate = (db) => {
        ComplianceRuleEvaluation.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        ComplianceRuleEvaluation.belongsTo(db.ComplianceRule, { as: 'rule', foreignKey: 'rule_id' });
    };

    return ComplianceRuleEvaluation;
};
