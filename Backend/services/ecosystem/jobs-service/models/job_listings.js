'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const JobListing = sequelize.define('JobListing', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        created_by: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        requirements: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        country_id: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        department_id: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        job_type: {
            type: DataTypes.STRING(50),
            defaultValue: 'full_time',
            validate: {
                isIn: [['full_time', 'part_time', 'contract', 'internship']],
            },
        },
        experience_level: {
            type: DataTypes.STRING(50),
            defaultValue: 'mid',
            validate: {
                isIn: [['entry', 'mid', 'senior', 'lead']],
            },
        },
        salary_min: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        salary_max: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        currency: {
            type: DataTypes.STRING(10),
            defaultValue: 'INR',
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: 'draft',
            validate: {
                isIn: [['draft', 'published', 'closed', 'archived']],
            },
        },
        remote_allowed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        deadline: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        views_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        applications_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        published_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        closes_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        seo_json_ld: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        salary_currency: {
            type: DataTypes.STRING(10),
            defaultValue: 'INR',
        },
    }, {
        tableName: 'job_listings',
        schema: 'jobs',
        underscored: true,
        timestamps: true,
    });

    return JobListing;
};
