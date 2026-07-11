'use strict';
module.exports = (sequelize, DataTypes) => {
    const City = sequelize.define('City', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        state_id: { type: DataTypes.INTEGER, allowNull: false },
        country_code: { type: DataTypes.STRING(2), allowNull: false },
        name: { type: DataTypes.STRING(160), allowNull: false },
    }, {
        schema: 'legal',
        tableName: 'cities',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    City.associate = (db) => {
        City.belongsTo(db.State, { foreignKey: 'state_id', as: 'state' });
        City.hasMany(db.Lawyer, { foreignKey: 'city_id', as: 'lawyers' });
    };

    return City;
};
