'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('training_course', {
        id:            { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id:        { type: DataTypes.STRING(128), allowNull: true },
        title:         { type: DataTypes.STRING(200), allowNull: false },
        description:   { type: DataTypes.TEXT, allowNull: true },
        category:      { type: DataTypes.STRING(80), allowNull: true },
        required:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        passing_score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 70 }, // %
        status:        { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'published' }, // draft|published|archived
        created_by:    { type: DataTypes.STRING(64), allowNull: true },
        created_at:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'training_courses', schema: 'agent', timestamps: false,
        indexes: [{ fields: ['org_id'] }, { fields: ['status'] }],
    });
};
