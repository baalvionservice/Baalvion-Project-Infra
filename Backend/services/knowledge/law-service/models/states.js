'use strict';
module.exports = (sequelize, DataTypes) => {
    const State = sequelize.define('State', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        country_code: { type: DataTypes.STRING(2), allowNull: false },
        name: { type: DataTypes.STRING(120), allowNull: false },
        code: { type: DataTypes.STRING(10) },
    }, {
        schema: 'legal',
        tableName: 'states',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    State.associate = (db) => {
        State.hasMany(db.City, { foreignKey: 'state_id', as: 'cities' });
        State.hasMany(db.Lawyer, { foreignKey: 'state_id', as: 'lawyers' });
    };

    return State;
};
