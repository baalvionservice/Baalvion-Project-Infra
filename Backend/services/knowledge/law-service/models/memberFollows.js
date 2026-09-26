'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('MemberFollow', {
        user_id: { type: DataTypes.TEXT, primaryKey: true },
        entity_type: { type: DataTypes.STRING(30), primaryKey: true },
        entity_slug: { type: DataTypes.STRING(200), primaryKey: true },
    }, {
        schema: 'legal',
        tableName: 'member_follows',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });
