'use strict';
// Address Verification — registered office/corporate office/factory/warehouse/
// branch addresses (Phase 2 Trust/Verification/Compliance Foundation, migration
// 030). Factory/warehouse rows are also the location a Facility (migration 031)
// points at.
module.exports = (sequelize, DataTypes) => {
    const ADDRESS_TYPES = ['registered_office', 'corporate_office', 'factory', 'warehouse', 'branch'];
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const VerifiedAddress = sequelize.define('VerifiedAddress', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        address_type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [ADDRESS_TYPES] } },
        line1: { type: DataTypes.TEXT, allowNull: false },
        line2: { type: DataTypes.TEXT },
        city: { type: DataTypes.TEXT },
        state: { type: DataTypes.TEXT },
        postal_code: { type: DataTypes.TEXT },
        country: { type: DataTypes.TEXT },
        latitude: { type: DataTypes.DECIMAL(9, 6) },
        longitude: { type: DataTypes.DECIMAL(9, 6) },
        status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'submitted', validate: { isIn: [STATUSES] } },
        reviewed_by: { type: DataTypes.TEXT },
        reviewed_at: { type: DataTypes.DATE },
        rejection_reason: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'verified_addresses',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    VerifiedAddress.ADDRESS_TYPES = ADDRESS_TYPES;
    VerifiedAddress.STATUSES = STATUSES;

    VerifiedAddress.associate = (db) => {
        VerifiedAddress.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        VerifiedAddress.hasMany(db.AddressEvidence, { as: 'evidence', foreignKey: 'address_id' });
    };

    return VerifiedAddress;
};
