'use strict';
// General Average (York-Antwerp Rules), migration 066. When a master sacrifices
// cargo or incurs extraordinary expense to save the common maritime adventure —
// the real mechanism behind "containers went over the side" — every cargo
// interest on that voyage contributes pro rata to the loss, insured or not.
// Two tables: the shipowner's declaration for the voyage, and one contribution
// row per cargo interest, apportioned by contributory value.
module.exports = (sequelize, DataTypes) => {
    const GA_STATUSES = ['declared', 'adjusting', 'secured', 'settled', 'closed'];
    const SECURITY_TYPES = ['none', 'average_bond', 'average_guarantee', 'cash_deposit'];
    const CONTRIBUTION_STATUSES = ['pending', 'secured', 'settled', 'waived'];

    const GeneralAverageDeclaration = sequelize.define('GeneralAverageDeclaration', {
        id: { type: DataTypes.STRING(64), primaryKey: true }, // 'GA-...'
        tenant_id: { type: DataTypes.TEXT },
        incident_id: { type: DataTypes.UUID },
        vessel_name: { type: DataTypes.TEXT },
        voyage_no: { type: DataTypes.TEXT },
        declared_by: { type: DataTypes.TEXT },
        average_adjuster: { type: DataTypes.TEXT },
        declared_at: { type: DataTypes.DATE },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'declared', validate: { isIn: [GA_STATUSES] } },
        currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
        sacrifice_value: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        salvage_expenses: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        total_contributory_value: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        contribution_rate: { type: DataTypes.DECIMAL(12, 8) },
        adjustment_ref: { type: DataTypes.TEXT },
        notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'general_average_declarations',
        underscored: true,
        timestamps: true,
    });

    const GeneralAverageContribution = sequelize.define('GeneralAverageContribution', {
        id: { type: DataTypes.STRING(64), primaryKey: true }, // 'GAC-...'
        tenant_id: { type: DataTypes.TEXT },
        ga_id: { type: DataTypes.STRING(64), allowNull: false },
        policy_id: { type: DataTypes.STRING(64) },
        shipment_id: { type: DataTypes.UUID },   // FK to tradeops.shipments (migration 068)
        container_id: { type: DataTypes.UUID },
        cargo_owner: { type: DataTypes.TEXT },
        contributory_value: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        contribution_amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        security_type: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'none', validate: { isIn: [SECURITY_TYPES] } },
        security_ref: { type: DataTypes.TEXT },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'pending', validate: { isIn: [CONTRIBUTION_STATUSES] } },
        settled_at: { type: DataTypes.DATE },
        payment_ref: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'general_average_contributions',
        underscored: true,
        timestamps: true,
    });

    GeneralAverageDeclaration.STATUSES = GA_STATUSES;
    GeneralAverageContribution.SECURITY_TYPES = SECURITY_TYPES;
    GeneralAverageContribution.STATUSES = CONTRIBUTION_STATUSES;

    GeneralAverageDeclaration.associate = (db) => {
        GeneralAverageDeclaration.hasMany(db.GeneralAverageContribution, { as: 'contributions', foreignKey: 'ga_id' });
        GeneralAverageDeclaration.belongsTo(db.Incident, { as: 'incident', foreignKey: 'incident_id', constraints: false });
    };

    GeneralAverageContribution.associate = (db) => {
        GeneralAverageContribution.belongsTo(db.GeneralAverageDeclaration, { as: 'declaration', foreignKey: 'ga_id' });
        GeneralAverageContribution.belongsTo(db.InsurancePolicy, { as: 'policy', foreignKey: 'policy_id', constraints: false });
    };

    return { GeneralAverageDeclaration, GeneralAverageContribution };
};
