'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Milestone', {
    id:          { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:      { type: DataTypes.UUID, allowNull: false },
    project_id:  {
        type: DataTypes.BIGINT, allowNull: false,
        references: { model: { tableName: 'projects', schema: 'jobs' }, key: 'id' }, onDelete: 'CASCADE',
    },
    title:       { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
        type: DataTypes.STRING(24), defaultValue: 'pending',
        validate: { isIn: [['pending', 'in_progress', 'completed', 'approved']] },
    },
    amount:      { type: DataTypes.BIGINT, allowNull: true },
    due_date:    { type: DataTypes.DATEONLY, allowNull: true },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { schema: 'jobs', tableName: 'milestones', underscored: true, timestamps: true });
