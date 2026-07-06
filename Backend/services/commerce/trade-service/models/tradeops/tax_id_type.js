'use strict';
// Tax ID Types — country-configurable tax-identifier catalog (Phase 2 Trust/
// Verification/Compliance Foundation, migration 025). Global reference/config data
// (no tenant_id, like HsCode/SanctionedParty) so adding a new country's identifier
// is a data insert, not a code change.
module.exports = (sequelize, DataTypes) => {
    const TaxIdType = sequelize.define('TaxIdType', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        country_code: { type: DataTypes.TEXT, allowNull: false },
        type_code: { type: DataTypes.TEXT, allowNull: false },
        label: { type: DataTypes.TEXT, allowNull: false },
        validation_regex: { type: DataTypes.TEXT },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        schema: 'tradeops',
        tableName: 'tax_id_types',
        underscored: true,
        timestamps: true,
    });

    return TaxIdType;
};
