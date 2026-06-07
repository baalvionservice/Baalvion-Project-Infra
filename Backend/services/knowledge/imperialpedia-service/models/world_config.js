'use strict';

/**
 * Singleton configuration for the public World page (/world).
 * One row (id = 1) holding the full config JSON: per-region market symbols,
 * the watchlist, and feed settings. Edited from the admin-platform
 * "World Control" panel; read (public) by the Imperialpedia World page.
 */
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('world_config', {
        id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
        config: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        updated_by: { type: DataTypes.STRING(120), allowNull: true },
    }, {
        tableName: 'world_config',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
    });
};
