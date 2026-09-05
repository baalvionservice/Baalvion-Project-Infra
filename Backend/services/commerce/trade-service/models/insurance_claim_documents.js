'use strict';
module.exports = (sequelize, DataTypes) => {
    // Evidence attached to an insurance claim (migration 066). doc_role is what the
    // document PROVES ("survey_report", "bill_of_lading", ...); document_id points at
    // the real document engine row (tradeops.documents) that holds the bytes, its
    // versions and its AV-scan status. One row per role per claim.
    const ROLES = [
        'bill_of_lading', 'commercial_invoice', 'packing_list', 'survey_report',
        'photo_evidence', 'police_report', 'carrier_claim_letter', 'non_delivery_certificate',
        'delivery_receipt', 'weather_report', 'repair_estimate', 'general_average_bond',
        'insurance_certificate', 'other',
    ];
    const STATUSES = ['attached', 'verified', 'rejected'];

    const InsuranceClaimDocument = sequelize.define('InsuranceClaimDocument', {
        id: { type: DataTypes.STRING(64), primaryKey: true }, // 'CLD-...'
        tenant_id: { type: DataTypes.TEXT },
        claim_id: { type: DataTypes.STRING(64), allowNull: false },
        doc_role: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [ROLES] } },
        document_id: { type: DataTypes.UUID },
        title: { type: DataTypes.TEXT },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'attached', validate: { isIn: [STATUSES] } },
        note: { type: DataTypes.TEXT },
        uploaded_by: { type: DataTypes.TEXT },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'trade',
        tableName: 'insurance_claim_documents',
        underscored: true,
        timestamps: true,
    });

    InsuranceClaimDocument.ROLES = ROLES;
    InsuranceClaimDocument.STATUSES = STATUSES;

    InsuranceClaimDocument.associate = (db) => {
        InsuranceClaimDocument.belongsTo(db.InsuranceClaim, { as: 'claim', foreignKey: 'claim_id' });
        InsuranceClaimDocument.belongsTo(db.TradeDocument, { as: 'document', foreignKey: 'document_id', constraints: false });
    };

    return InsuranceClaimDocument;
};
