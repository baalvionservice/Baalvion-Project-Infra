'use strict';
module.exports = (sequelize, DataTypes) => {
    const PracticeArea = sequelize.define('PracticeArea', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
        slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        order: { type: DataTypes.INTEGER, defaultValue: 0, field: 'order' },
    }, {
        schema: 'legal',
        tableName: 'practice_areas',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    PracticeArea.associate = (db) => {
        PracticeArea.belongsToMany(db.Lawyer, {
            through: db.LawyerPracticeArea,
            foreignKey: 'practice_area_id',
            otherKey: 'lawyer_id',
            as: 'lawyers',
        });
    };

    return PracticeArea;
};
