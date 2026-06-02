'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('agent_enrollment', {
        id:               { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        agent_id:         { type: DataTypes.UUID, allowNull: false },
        course_id:        { type: DataTypes.UUID, allowNull: false },
        org_id:           { type: DataTypes.STRING(128), allowNull: true },
        status:           { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'enrolled' }, // enrolled|in_progress|completed|certified|failed
        progress_pct:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        completed_modules:{ type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        score:            { type: DataTypes.INTEGER, allowNull: true },
        certified_at:     { type: DataTypes.DATE, allowNull: true },
        certificate_id:   { type: DataTypes.STRING(48), allowNull: true },
        enrolled_at:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'agent_enrollments', schema: 'agent', timestamps: false,
        indexes: [{ unique: true, fields: ['agent_id', 'course_id'] }, { fields: ['status'] }],
    });
};
