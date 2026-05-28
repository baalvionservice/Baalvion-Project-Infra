'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('submissions', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    task_id:     { type: DataTypes.UUID, allowNull: false },
    user_id:     { type: DataTypes.BIGINT, allowNull: false },
    code_url:    { type: DataTypes.TEXT },
    demo_url:    { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    notes:       { type: DataTypes.TEXT },
    status:      { type: DataTypes.ENUM('pending', 'under_review', 'accepted', 'rejected', 'withdrawn'), defaultValue: 'pending' },
    score:       { type: DataTypes.DECIMAL(5, 2) },
    feedback:    { type: DataTypes.TEXT },
    rank:        { type: DataTypes.INTEGER },
    metadata:    { type: DataTypes.JSONB, defaultValue: {} },
    submitted_at:{ type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { schema: 'ctm', tableName: 'submissions' });
