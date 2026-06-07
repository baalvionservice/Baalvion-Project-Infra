'use strict';
// Aligned to the live `ir.ir_contacts` table (is_active; no bio/photo_url columns).
module.exports = (sequelize, DataTypes) => {
    const IrContact = sequelize.define('IrContact', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        title: { type: DataTypes.STRING(255) },
        email: { type: DataTypes.STRING(255) },
        phone: { type: DataTypes.STRING(50) },
        department: { type: DataTypes.STRING(100) },
        is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        schema: 'ir',
        tableName: 'ir_contacts',
        underscored: true,
        timestamps: true,
    });
    return IrContact;
};
