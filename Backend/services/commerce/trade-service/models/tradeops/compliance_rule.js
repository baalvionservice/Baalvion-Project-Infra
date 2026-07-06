'use strict';
// Compliance Engine — data-driven onboarding/compliance rule definitions (Phase 2
// Trust/Verification/Compliance Foundation, migration 033). Global config (no
// tenant_id, like HsCode) — every tenant is evaluated against the same rule set;
// adding a check is a row insert, not a code change.
module.exports = (sequelize, DataTypes) => {
    const CATEGORIES = ['document_completeness', 'license_expiry', 'profile_completeness', 'country_restriction', 'internal_policy'];
    const SEVERITIES = ['info', 'warning', 'blocking'];

    const ComplianceRule = sequelize.define('ComplianceRule', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        rule_code: { type: DataTypes.TEXT, allowNull: false },
        category: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [CATEGORIES] } },
        description: { type: DataTypes.TEXT },
        condition: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        severity: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'warning', validate: { isIn: [SEVERITIES] } },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        schema: 'tradeops',
        tableName: 'compliance_rules',
        underscored: true,
        timestamps: true,
    });

    ComplianceRule.CATEGORIES = CATEGORIES;
    ComplianceRule.SEVERITIES = SEVERITIES;

    return ComplianceRule;
};
