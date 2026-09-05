'use strict';
// Coverage rota (Compression, Phase 7) — a recurring weekly window, in UTC.
// Schema `tradeops`, tenant-scoped. `days` uses ISO weekday numbers (1=Mon..7=Sun)
// and an end_hour at or below start_hour denotes a window wrapping past midnight,
// which is how an overnight desk is actually staffed. The point of the table is to
// turn "waiting for someone's morning" into a number. See migration 084.
module.exports = (sequelize, DataTypes) => {
    const AuthorityRota = sequelize.define('AuthorityRota', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        name: { type: DataTypes.TEXT, allowNull: false },
        roles: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        days: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },   // ISO 1..7
        start_hour: { type: DataTypes.DECIMAL(4, 2), allowNull: false },       // UTC
        end_hour: { type: DataTypes.DECIMAL(4, 2), allowNull: false },         // UTC
        timezone_note: { type: DataTypes.TEXT },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        schema: 'tradeops',
        tableName: 'authority_rota',
        underscored: true,
        timestamps: true,
    });

    return AuthorityRota;
};
