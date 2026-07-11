'use strict';
module.exports = (sequelize, DataTypes) => {
    const LawyerPracticeArea = sequelize.define('LawyerPracticeArea', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        practice_area_id: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        schema: 'legal',
        tableName: 'lawyer_practice_areas',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    return LawyerPracticeArea;
};
