'use strict';
module.exports = (sequelize, DataTypes) => {
    const LawyerConnection = sequelize.define('LawyerConnection', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        requester_id: { type: DataTypes.INTEGER, allowNull: false },
        addressee_id: { type: DataTypes.INTEGER, allowNull: false },
        relation: {
            type: DataTypes.ENUM('follow', 'connect', 'collaborate'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'declined'),
            defaultValue: 'pending',
        },
    }, {
        schema: 'legal',
        tableName: 'lawyer_connections',
        underscored: true,
        timestamps: true,
    });

    LawyerConnection.associate = (db) => {
        LawyerConnection.belongsTo(db.Lawyer, { foreignKey: 'requester_id', as: 'requester' });
        LawyerConnection.belongsTo(db.Lawyer, { foreignKey: 'addressee_id', as: 'addressee' });
    };

    return LawyerConnection;
};
