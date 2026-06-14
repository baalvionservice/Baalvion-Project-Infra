'use strict';
// A private viewing / virtual try-on / consultation appointment booked by a client.
module.exports = (sequelize, DataTypes) => {
    const Appointment = sequelize.define('Appointment', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        brandId: { type: DataTypes.STRING, allowNull: false },
        customerId: { type: DataTypes.STRING },
        customerName: { type: DataTypes.STRING, allowNull: false },
        customerEmail: { type: DataTypes.STRING },
        type: { type: DataTypes.STRING, defaultValue: 'Private Viewing' },
        date: { type: DataTypes.DATEONLY },
        time: { type: DataTypes.STRING },
        city: { type: DataTypes.STRING },
        notes: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING, defaultValue: 'pending' },
    }, {
        schema: 'crm',
        tableName: 'appointments',
        underscored: true,
        timestamps: true,
    });
    return Appointment;
};
