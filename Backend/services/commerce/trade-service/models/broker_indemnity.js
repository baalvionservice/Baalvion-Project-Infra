'use strict';
module.exports = (sequelize, DataTypes) => {
    // The broker's OWN professional indemnity / E&O cover (migration 072).
    //
    // Every other insurance record on this platform is cover the platform SELLS. This
    // is the one where the platform is the insured: it answers when the assured sues
    // the broker because the cover did not respond — wrong sum insured, a material
    // fact not passed to the underwriter, a binder breached. Brokers do not fail
    // because ships sink; they fail on unfunded E&O claims.
    const BroookerIndemnity = sequelize.define('BrokerIndemnity', {
        id: { type: DataTypes.STRING(64), primaryKey: true }, // 'PI-...'
        tenant_id: { type: DataTypes.TEXT },
        cover_type: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'professional_indemnity', validate: { isIn: [['professional_indemnity', 'errors_omissions', 'fidelity', 'cyber']] } },
        insurer: { type: DataTypes.TEXT, allowNull: false },
        policy_number: { type: DataTypes.TEXT, allowNull: false },
        currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
        limit_of_indemnity: { type: DataTypes.DECIMAL(20, 2) },
        // Borne by the broker on every claim before this policy responds.
        retention: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        // Claims-made cover answers only for claims NOTIFIED during the period,
        // however old the act was — so the retroactive date matters as much as the
        // period, and a gap in it is an uninsured tail.
        basis: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'claims_made', validate: { isIn: [['claims_made', 'losses_occurring']] } },
        retroactive_date: { type: DataTypes.DATEONLY },
        period_start: { type: DataTypes.DATE },
        period_end: { type: DataTypes.DATE },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'active', validate: { isIn: [['active', 'lapsed', 'cancelled', 'pending']] } },
        broker_notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'broker_indemnity',
        underscored: true,
        timestamps: true,
    });

    /** In force right now? A lapsed E&O policy leaves every placement unfunded. */
    BroookerIndemnity.prototype.inForce = function inForce(at = new Date()) {
        if (this.status !== 'active') return { ok: false, reason: `E&O cover is '${this.status}'` };
        if (this.period_start && at < new Date(this.period_start)) return { ok: false, reason: 'E&O cover has not incepted' };
        if (this.period_end && at > new Date(this.period_end)) return { ok: false, reason: `E&O cover expired on ${new Date(this.period_end).toISOString().slice(0, 10)}` };
        return { ok: true, reason: null };
    };

    return BroookerIndemnity;
};
