'use strict';
module.exports = (sequelize, DataTypes) => {
    const EarningsCall = sequelize.define('EarningsCall', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER },
        fiscal_quarter: { type: DataTypes.INTEGER },
        scheduled_at: { type: DataTypes.DATE, allowNull: false },
        duration_min: { type: DataTypes.INTEGER, defaultValue: 60 },
        webcast_url: { type: DataTypes.STRING(500) },
        dial_in_number: { type: DataTypes.STRING(100) },
        dial_in_passcode: { type: DataTypes.STRING(50) },
        status: {
            type: DataTypes.ENUM('scheduled', 'live', 'completed', 'cancelled'),
            defaultValue: 'scheduled',
        },
        recording_url: { type: DataTypes.STRING(500) },
        transcript_url: { type: DataTypes.STRING(500) },
        transcript_text: { type: DataTypes.TEXT },
        summary: { type: DataTypes.TEXT },
        participants: { type: DataTypes.JSONB, defaultValue: [] },
        created_by: { type: DataTypes.INTEGER },
    }, {
        schema: 'ir',
        tableName: 'earnings_calls',
        underscored: true,
        timestamps: true,
    });
    return EarningsCall;
};
