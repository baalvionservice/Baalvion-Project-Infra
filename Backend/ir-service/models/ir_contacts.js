'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrContact = sequelize.define('IrContact', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        title: { type: DataTypes.STRING(200) },
        email: { type: DataTypes.STRING(255) },
        phone: { type: DataTypes.STRING(50) },
        department: { type: DataTypes.STRING(100) },
        is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
        bio: { type: DataTypes.TEXT },
        photo_url: { type: DataTypes.STRING(500) },
    }, {
        schema: 'ir',
        tableName: 'ir_contacts',
        underscored: true,
        timestamps: true,
    });
    return IrContact;
};
