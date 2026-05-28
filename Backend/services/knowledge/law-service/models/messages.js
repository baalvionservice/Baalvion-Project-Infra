'use strict';
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        case_id: { type: DataTypes.INTEGER, allowNull: true },
        booking_id: { type: DataTypes.INTEGER, allowNull: true },
        sender_id: { type: DataTypes.TEXT, allowNull: false },
        receiver_id: { type: DataTypes.TEXT, allowNull: false },
        content: { type: DataTypes.TEXT, allowNull: false },
        type: {
            type: DataTypes.ENUM('text', 'file', 'system'),
            defaultValue: 'text',
        },
        file_url: { type: DataTypes.TEXT, allowNull: true },
        read_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        schema: 'legal',
        tableName: 'messages',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    Message.associate = (db) => {
        Message.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
        Message.belongsTo(db.Booking, { foreignKey: 'booking_id', as: 'booking' });
    };

    return Message;
};
