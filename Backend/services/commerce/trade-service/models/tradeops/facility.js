'use strict';
// Factory & Warehouse Verification — the richer profile beyond a bare address
// (production/warehouse capacity, employee count, photos/videos, GPS, third-party
// inspection status). Phase 2 Trust/Verification/Compliance Foundation, migration
// 031.
module.exports = (sequelize, DataTypes) => {
    const FACILITY_TYPES = ['factory', 'warehouse'];
    const INSPECTION_STATUSES = ['not_requested', 'scheduled', 'passed', 'failed'];
    const STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'expired'];

    const Facility = sequelize.define('Facility', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        org_id: { type: DataTypes.INTEGER, allowNull: false },
        facility_type: { type: DataTypes.TEXT, allowNull: false, validate: { isIn: [FACILITY_TYPES] } },
        address_id: { type: DataTypes.UUID },
        production_capacity: { type: DataTypes.TEXT },
        warehouse_capacity: { type: DataTypes.TEXT },
        employee_count: { type: DataTypes.INTEGER },
        gps_latitude: { type: DataTypes.DECIMAL(9, 6) },
        gps_longitude: { type: DataTypes.DECIMAL(9, 6) },
        media: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        inspection_status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'not_requested', validate: { isIn: [INSPECTION_STATUSES] } },
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
        tableName: 'facilities',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    Facility.FACILITY_TYPES = FACILITY_TYPES;
    Facility.INSPECTION_STATUSES = INSPECTION_STATUSES;
    Facility.STATUSES = STATUSES;

    Facility.associate = (db) => {
        Facility.belongsTo(db.Organization, { as: 'organization', foreignKey: 'org_id', constraints: false });
        Facility.belongsTo(db.VerifiedAddress, { as: 'address', foreignKey: 'address_id', constraints: false });
    };

    return Facility;
};
