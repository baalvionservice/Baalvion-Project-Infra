'use strict';
module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.TEXT, allowNull: false },
        type: { type: DataTypes.TEXT, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        read: { type: DataTypes.BOOLEAN, defaultValue: false },
        data: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        schema: 'legal',
        tableName: 'notifications',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    return Notification;
};
