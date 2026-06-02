'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('training_module', {
        id:          { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        course_id:   { type: DataTypes.UUID, allowNull: false },
        title:       { type: DataTypes.STRING(200), allowNull: false },
        position:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        content_type:{ type: DataTypes.STRING(16), allowNull: false, defaultValue: 'video' }, // video|article|quiz
        content_url: { type: DataTypes.TEXT, allowNull: true },
        body:        { type: DataTypes.TEXT, allowNull: true },
        metadata:    { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_at:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'training_modules', schema: 'agent', timestamps: false,
        indexes: [{ fields: ['course_id', 'position'] }],
    });
};
