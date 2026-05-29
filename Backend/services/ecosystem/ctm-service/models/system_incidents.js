'use strict';
const { DataTypes } = require('sequelize');

// Incidents — opened automatically when a dependency health-probe reports Down/Degraded
// and resolved when it recovers. Real, derived from actual probe results.
module.exports = (sequelize) => sequelize.define('system_incidents', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    service_name:     { type: DataTypes.STRING(60), allowNull: false },
    status:           { type: DataTypes.ENUM('Resolved', 'Ongoing', 'Investigating'), defaultValue: 'Ongoing' },
    start_time:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    end_time:         { type: DataTypes.DATE },
    duration_minutes: { type: DataTypes.INTEGER },
    description:      { type: DataTypes.TEXT },
}, { schema: 'ctm', tableName: 'system_incidents', timestamps: false });
