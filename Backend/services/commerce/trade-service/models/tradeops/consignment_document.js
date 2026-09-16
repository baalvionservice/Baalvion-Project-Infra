'use strict';
// Derived consignment document (Compression, Phase 1). A PROJECTION of the
// canonical consignment — never separately authored, which is what stops the
// invoice, the packing list and the declaration from disagreeing. source_hash
// records the consignment revision it was generated from; when that no longer
// matches the parent, the document is stale and must be regenerated before use.
// Schema `tradeops`, tenant-scoped. See migration 079 + service/consignment/derive.js.
module.exports = (sequelize, DataTypes) => {
    const ConsignmentDocument = sequelize.define('ConsignmentDocument', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        consignment_id: { type: DataTypes.UUID, allowNull: false },
        doc_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['commercial_invoice', 'packing_list', 'certificate_of_origin', 'shipping_instruction', 'customs_declaration']] },
        },
        payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        source_hash: { type: DataTypes.TEXT, allowNull: false },
        content_hash: { type: DataTypes.TEXT },
        deriver_version: { type: DataTypes.TEXT },
        generated_at: { type: DataTypes.DATE },
    }, {
        schema: 'tradeops',
        tableName: 'consignment_documents',
        underscored: true,
        timestamps: true,
    });

    ConsignmentDocument.associate = (db) => {
        if (db.Consignment) {
            ConsignmentDocument.belongsTo(db.Consignment, { as: 'consignment', foreignKey: 'consignment_id' });
        }
    };

    return ConsignmentDocument;
};
