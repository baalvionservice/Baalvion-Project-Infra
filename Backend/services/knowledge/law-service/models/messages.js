'use strict';
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        case_id: { type: DataTypes.INTEGER, allowNull: true },
        booking_id: { type: DataTypes.INTEGER, allowNull: true },
        sender_id: { type: DataTypes.TEXT, allowNull: false },
        receiver_id: { type: DataTypes.TEXT, allowNull: false },
        content: { type: DataTypes.TEXT, allowNull: false },
        // 'call' = a call-invite message (ad-hoc video/voice, spec area 7);
        // content carries a human-readable label, file_url carries the room
        // join URL (metadata via a call: prefix would overcomplicate this —
        // the room is re-derivable any time from the same two participants).
        type: {
            type: DataTypes.ENUM('text', 'file', 'system', 'call'),
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
