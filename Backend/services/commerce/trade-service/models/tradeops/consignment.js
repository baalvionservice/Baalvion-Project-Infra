'use strict';
// Canonical Consignment (Compression, Phase 1) — the single source of truth for a
// shipment's facts. Schema `tradeops`, UUID PK, tenant-scoped (RLS + index.js hooks).
// `canonical` is the normalized record (service/consignment/schema.js); source_hash
// is a sha256 over it, and every derived document stores the hash it came from so
// staleness is detectable rather than assumed. See migration 079.
module.exports = (sequelize, DataTypes) => {
    const Consignment = sequelize.define('Consignment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        reference: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'active', 'locked', 'cancelled']] },
        },
        direction: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'export',
            validate: { isIn: [['import', 'export']] },
        },
        trade_operation_id: { type: DataTypes.UUID },
        shipment_id: { type: DataTypes.UUID },
        origin_country: { type: DataTypes.TEXT },
        destination_country: { type: DataTypes.TEXT },
        incoterm: { type: DataTypes.TEXT },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        canonical: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        totals: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        source_hash: { type: DataTypes.TEXT },
        schema_version: { type: DataTypes.TEXT },
        locked_at: { type: DataTypes.DATE },  // filed with a gateway ⇒ no silent edits
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'consignments',
        underscored: true,
        timestamps: true,
    });

    Consignment.associate = (db) => {
        if (db.ConsignmentDocument) {
            Consignment.hasMany(db.ConsignmentDocument, { as: 'documents', foreignKey: 'consignment_id' });
        }
        if (db.TradeOperation) {
            Consignment.belongsTo(db.TradeOperation, { as: 'tradeOperation', foreignKey: 'trade_operation_id' });
        }
    };

    return Consignment;
};
