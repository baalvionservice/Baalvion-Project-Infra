'use strict';
// Aligned to the live `ir.earnings_calls` table (year/quarter, not fiscal_*; varchar
// status; transcript/replay/dial_in_info columns).
module.exports = (sequelize, DataTypes) => {
    const EarningsCall = sequelize.define('EarningsCall', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        created_by: { type: DataTypes.BIGINT },
        title: { type: DataTypes.STRING(500), allowNull: false },
        quarter: { type: DataTypes.INTEGER },
        year: { type: DataTypes.INTEGER },
        scheduled_at: { type: DataTypes.DATE },
        recorded_at: { type: DataTypes.DATE },
        status: { type: DataTypes.STRING, defaultValue: 'scheduled' },
        dial_in_info: { type: DataTypes.TEXT },
        webcast_url: { type: DataTypes.TEXT },
        replay_url: { type: DataTypes.TEXT },
        transcript: { type: DataTypes.TEXT },
        summary: { type: DataTypes.TEXT },
        highlights: { type: DataTypes.JSONB, defaultValue: [] },
        participants: { type: DataTypes.JSONB, defaultValue: [] },
    }, {
        schema: 'ir',
        tableName: 'earnings_calls',
        underscored: true,
        timestamps: true,
    });
    return EarningsCall;
};
