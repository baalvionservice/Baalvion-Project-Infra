'use strict';
// Address Evidence — join table linking a VerifiedAddress to its supporting
// documents (utility bill / lease / tax document), reusing the existing Document
// Management engine (Phase 2 Trust/Verification/Compliance Foundation, migration
// 030). Append-only.
module.exports = (sequelize, DataTypes) => {
    const EVIDENCE_TYPES = ['utility_bill', 'lease', 'tax_document'];

    const AddressEvidence = sequelize.define('AddressEvidence', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        address_id: { type: DataTypes.UUID, allowNull: false },
        document_id: { type: DataTypes.UUID, allowNull: false },
        evidence_type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [EVIDENCE_TYPES] } },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'address_evidence',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    AddressEvidence.EVIDENCE_TYPES = EVIDENCE_TYPES;

    AddressEvidence.associate = (db) => {
        AddressEvidence.belongsTo(db.VerifiedAddress, { as: 'address', foreignKey: 'address_id' });
        AddressEvidence.belongsTo(db.TradeDocument, { as: 'document', foreignKey: 'document_id', constraints: false });
    };

    return AddressEvidence;
};
