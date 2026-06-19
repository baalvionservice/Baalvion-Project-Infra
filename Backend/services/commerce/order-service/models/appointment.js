'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Appointment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        // Authenticated owner (nullable: guests book via ownerSessionId).
        userId: { type: DataTypes.BIGINT, allowNull: true },
        customerName: { type: DataTypes.STRING(200), allowNull: false },
        customerEmail: { type: DataTypes.STRING(254), allowNull: false },
        customerPhone: { type: DataTypes.STRING(30), allowNull: true },
        type: { type: DataTypes.ENUM('showroom', 'virtual', 'in_home', 'phone'), defaultValue: 'showroom' },
        status: { type: DataTypes.ENUM('requested', 'confirmed', 'cancelled', 'completed', 'no_show'), defaultValue: 'requested' },
        preferredAt: { type: DataTypes.DATE, allowNull: false },
        confirmedAt: { type: DataTypes.DATE, allowNull: true },
        location: { type: DataTypes.STRING(200), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        // Guest ownership: the signed X-Cart-Session bound at booking time.
        ownerSessionId: { type: DataTypes.STRING(200), allowNull: true },
        processedBy: { type: DataTypes.BIGINT, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'appointments' });
};
