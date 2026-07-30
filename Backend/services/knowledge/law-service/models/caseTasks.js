'use strict';
module.exports = (sequelize, DataTypes) => {
    const CaseTask = sequelize.define('CaseTask', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        case_id: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pending',
        },
    }, {
        schema: 'legal',
        tableName: 'case_tasks',
        underscored: true,
        timestamps: true,
    });

    CaseTask.associate = (db) => {
        CaseTask.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
    };

    return CaseTask;
};
