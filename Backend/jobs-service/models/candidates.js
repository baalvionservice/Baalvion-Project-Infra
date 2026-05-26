'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Candidate = sequelize.define('Candidate', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        full_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        resume_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        linkedin_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        portfolio_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: 'active',
            validate: {
                isIn: [['active', 'inactive', 'blacklisted']],
            },
        },
        source: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isIn: [['referral', 'linkedin', 'job_board', 'direct', null]],
            },
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tags: {
            type: DataTypes.JSONB,
            defaultValue: [],
        },
        skills: {
            type: DataTypes.ARRAY(DataTypes.TEXT),
            defaultValue: [],
        },
        headline: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        years_of_experience: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: true,
        },
    }, {
        tableName: 'candidates',
        schema: 'jobs',
        underscored: true,
        timestamps: true,
    });

    return Candidate;
};
