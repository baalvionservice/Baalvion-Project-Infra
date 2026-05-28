'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Application = sequelize.define('Application', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        job_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: { model: { tableName: 'job_listings', schema: 'jobs' }, key: 'id' },
            onDelete: 'CASCADE',
        },
        candidate_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: { model: { tableName: 'candidates', schema: 'jobs' }, key: 'id' },
            onDelete: 'CASCADE',
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(50),
            defaultValue: 'applied',
            validate: {
                isIn: [['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']],
            },
        },
        cover_letter: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resume_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        expected_salary: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        current_salary: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        notice_period_days: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        source: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        offered_salary: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        offer_accepted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        hired_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        score_breakdown: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        resume_skills: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            allowNull: true,
        },
        resume_parsed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'applications',
        schema: 'jobs',
        underscored: true,
        timestamps: true,
    });

    return Application;
};
