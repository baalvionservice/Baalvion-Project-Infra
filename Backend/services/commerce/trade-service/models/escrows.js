'use strict';
module.exports = (sequelize, DataTypes) => {
    const Escrow = sequelize.define('Escrow', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tenant_id: { type: DataTypes.TEXT },
        order_id: { type: DataTypes.INTEGER },
        buyer_org_id: { type: DataTypes.TEXT },
        seller_org_id: { type: DataTypes.TEXT },
        amount: { type: DataTypes.DECIMAL(20, 2) },
        currency: { type: DataTypes.STRING(10) },
        status: {
            type: DataTypes.ENUM('pending', 'funded', 'released', 'refunded', 'disputed'),
            defaultValue: 'pending',
        },
        funded_at: { type: DataTypes.DATE },
        released_at: { type: DataTypes.DATE },
        release_conditions: { type: DataTypes.JSONB, defaultValue: {} },
        mandate_hash: { type: DataTypes.TEXT },
        // Migration 043 — correlation keys for the escrow.hold.* webhook projection.
        // escrow_ref is assigned by the caller (unique per tenant on the Java side,
        // e.g. `ESCROW-ORDER-{orderId}`) and is the primary match key since it is
        // known before the Java escrow is created; java_escrow_id backfills once the
        // escrow.hold.created event confirms the Java-side id.
        escrow_ref: { type: DataTypes.TEXT },
        java_escrow_id: { type: DataTypes.UUID },
    }, {
        schema: 'trade',
        tableName: 'escrows',
        underscored: true,
        timestamps: true,
    });

    return Escrow;
};
