'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrEvent = sequelize.define('IrEvent', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        event_type: {
            type: DataTypes.ENUM('earnings_call', 'agm', 'investor_day', 'roadshow', 'conference', 'webinar'),
            defaultValue: 'earnings_call',
        },
        scheduled_at: { type: DataTypes.DATE, allowNull: false },
        end_at: { type: DataTypes.DATE },
        location: { type: DataTypes.STRING(300) },
        webcast_url: { type: DataTypes.STRING(500) },
        description: { type: DataTypes.TEXT },
        registration_url: { type: DataTypes.STRING(500) },
        status: {
            type: DataTypes.ENUM('upcoming', 'live', 'completed', 'cancelled'),
            defaultValue: 'upcoming',
        },
        created_by: { type: DataTypes.INTEGER },
    }, {
        schema: 'ir',
        tableName: 'ir_events',
        underscored: true,
        timestamps: true,
    });
    return IrEvent;
};
