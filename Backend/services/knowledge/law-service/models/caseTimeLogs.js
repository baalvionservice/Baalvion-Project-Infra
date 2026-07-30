'use strict';
module.exports = (sequelize, DataTypes) => {
    const CaseTimeLog = sequelize.define('CaseTimeLog', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        case_id: { type: DataTypes.INTEGER, allowNull: false },
        author_id: { type: DataTypes.INTEGER, allowNull: false },
        duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
        is_billable: { type: DataTypes.BOOLEAN, defaultValue: true },
        category: { type: DataTypes.STRING(50) },
        description: { type: DataTypes.TEXT },
    }, {
        schema: 'legal',
        tableName: 'case_time_logs',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    CaseTimeLog.associate = (db) => {
        CaseTimeLog.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
        CaseTimeLog.belongsTo(db.User, { foreignKey: 'author_id', as: 'author' });
    };

    return CaseTimeLog;
};
