'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const JobSkill = sequelize.define('JobSkill', {
        job_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            references: { model: { tableName: 'job_listings', schema: 'jobs' }, key: 'id' },
            onDelete: 'CASCADE',
        },
        skill_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            references: { model: { tableName: 'skills', schema: 'jobs' }, key: 'id' },
            onDelete: 'CASCADE',
        },
    }, {
        tableName: 'job_skills',
        schema: 'jobs',
        underscored: true,
        timestamps: false,
    });

    return JobSkill;
};
