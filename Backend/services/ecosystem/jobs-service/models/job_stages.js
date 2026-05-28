'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const JobStage = sequelize.define('JobStage', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        color: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: 'job_stages',
        schema: 'jobs',
        underscored: true,
        timestamps: true,
    });

    return JobStage;
};
