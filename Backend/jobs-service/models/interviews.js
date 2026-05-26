'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Interview = sequelize.define('Interview', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        application_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: { model: { tableName: 'applications', schema: 'jobs' }, key: 'id' },
            onDelete: 'CASCADE',
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        interviewer_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        scheduled_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        duration_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 60,
        },
        type: {
            type: DataTypes.STRING(50),
            defaultValue: 'video',
            validate: {
                isIn: [['video', 'phone', 'in_person', 'technical']],
            },
        },
        location: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: 'scheduled',
            validate: {
                isIn: [['scheduled', 'completed', 'cancelled', 'no_show']],
            },
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 1, max: 5 },
        },
        recommendation: {
            type: DataTypes.STRING(32),
            allowNull: true,
            validate: {
                isIn: [['strong_yes', 'yes', 'neutral', 'no', 'strong_no', null]],
            },
        },
    }, {
        tableName: 'interviews',
        schema: 'jobs',
        underscored: true,
        timestamps: true,
    });

    return Interview;
};
