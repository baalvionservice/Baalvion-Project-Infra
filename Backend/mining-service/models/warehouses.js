'use strict';

module.exports = (sequelize, DataTypes) => {
    const Warehouse = sequelize.define('Warehouse', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        country: { type: DataTypes.STRING(100), allowNull: true },
        city: { type: DataTypes.STRING(100), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        capacity_mt: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        available_mt: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        minerals_stored: { type: DataTypes.JSONB, defaultValue: [] },
        is_certified: { type: DataTypes.BOOLEAN, defaultValue: false },
        certifications: { type: DataTypes.JSONB, defaultValue: [] },
        contact_email: { type: DataTypes.STRING(255), allowNull: true },
        contact_phone: { type: DataTypes.STRING(50), allowNull: true },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active',
            validate: { isIn: [['active', 'inactive']] },
        },
    }, {
        tableName: 'warehouses',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    Warehouse.associate = () => {};

    return Warehouse;
};
