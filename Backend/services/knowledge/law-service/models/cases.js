'use strict';
module.exports = (sequelize, DataTypes) => {
    const Case = sequelize.define('Case', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        client_id: { type: DataTypes.INTEGER, allowNull: false },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT },
        category: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.ENUM('open', 'in_progress', 'closed', 'archived'),
            defaultValue: 'open',
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium',
        },
        outcome: { type: DataTypes.TEXT },
        closed_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        schema: 'legal',
        tableName: 'cases',
        underscored: true,
        timestamps: true,
    });

    Case.associate = (db) => {
        Case.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
        Case.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
        Case.hasMany(db.Booking, { foreignKey: 'case_id', as: 'bookings' });
        Case.hasMany(db.Message, { foreignKey: 'case_id', as: 'messages' });
        Case.hasMany(db.Document, { foreignKey: 'case_id', as: 'documents' });
    };

    return Case;
};
