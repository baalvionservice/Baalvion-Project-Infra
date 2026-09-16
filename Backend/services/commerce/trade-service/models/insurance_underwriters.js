'use strict';
module.exports = (sequelize, DataTypes) => {
    // The licensed carrier (or MGA) whose paper cover is written on, and the binding
    // authority the platform holds on it (migration 071).
    //
    // A binder is a delegated authority: it lets the platform bind cover on the
    // underwriter's behalf WITHOUT referring each risk, but only inside the limits
    // recorded here. Exceeding capacity_limit or per_risk_limit is a breach of that
    // authority, not merely an internal policy — which is why they are enforced in
    // service/insurance/placement.js rather than left as advisory numbers.
    const STATUSES = ['prospective', 'bound', 'suspended', 'expired', 'terminated'];

    const InsuranceUnderwriter = sequelize.define('InsuranceUnderwriter', {
        id: { type: DataTypes.STRING(64), primaryKey: true }, // 'UW-...'
        tenant_id: { type: DataTypes.TEXT },                  // null = platform-wide binder
        name: { type: DataTypes.TEXT, allowNull: false },
        legal_entity: { type: DataTypes.TEXT },
        adapter: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'manual' },
        binder_reference: { type: DataTypes.TEXT },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'prospective', validate: { isIn: [STATUSES] } },
        currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
        capacity_limit: { type: DataTypes.DECIMAL(20, 2) },
        per_risk_limit: { type: DataTypes.DECIMAL(20, 2) },
        // Fraction of gross premium the broker retains; the rest is remitted.
        commission_rate: { type: DataTypes.DECIMAL(6, 5), allowNull: false, defaultValue: 0, validate: { min: 0, max: 1 } },
        ledger_account_id: { type: DataTypes.UUID },
        binder_start: { type: DataTypes.DATE },
        binder_end: { type: DataTypes.DATE },
        lines_of_business: { type: DataTypes.JSONB, allowNull: false, defaultValue: ['cargo'] },
        // Binder scope (migration 072). An empty include-list means worldwide / all
        // commodities; the exclude-lists always win. These are the exclusions that
        // actually void marine cargo cover, so placement enforces them.
        territories_included: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        territories_excluded: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        commodities_excluded: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        // 'trust' = premium is collected into a segregated client-money account and
        // remitted from there; 'direct' = the carrier collects it and the broker
        // never holds it.
        premium_handling: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'trust', validate: { isIn: [['trust', 'direct']] } },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'insurance_underwriters',
        underscored: true,
        timestamps: true,
    });

    InsuranceUnderwriter.STATUSES = STATUSES;

    /** Is the binder live right now? A lapsed binder cannot accept new business. */
    InsuranceUnderwriter.prototype.isBindable = function isBindable(at = new Date()) {
        if (this.status !== 'bound') return { ok: false, reason: `binder status is '${this.status}'` };
        if (this.binder_start && at < new Date(this.binder_start)) return { ok: false, reason: 'binder has not incepted yet' };
        if (this.binder_end && at > new Date(this.binder_end)) return { ok: false, reason: 'binder has expired' };
        return { ok: true, reason: null };
    };

    InsuranceUnderwriter.associate = (db) => {
        InsuranceUnderwriter.hasMany(db.InsurancePolicy, { as: 'policies', foreignKey: 'underwriter_id', constraints: false });
    };

    return InsuranceUnderwriter;
};
