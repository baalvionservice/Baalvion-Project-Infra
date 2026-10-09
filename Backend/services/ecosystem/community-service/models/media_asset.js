'use strict';
const { DataTypes } = require('sequelize');

// Small user-uploaded images, stored in Postgres. 'restricted' assets (candidate photos) are only
// served to their owner, site admins and verified employers; 'public' ones to anyone.
module.exports = (sequelize) => sequelize.define('MediaAsset', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    owner_id: { type: DataTypes.UUID, allowNull: false },
    purpose: { type: DataTypes.ENUM('profile_photo', 'teacher_avatar', 'club_image', 'event_poster'), allowNull: false },
    visibility: { type: DataTypes.ENUM('public', 'restricted'), allowNull: false },
    mime: { type: DataTypes.STRING(20), allowNull: false },
    size_bytes: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.BLOB, allowNull: false },
}, {
    tableName: 'media_assets', schema: 'community', underscored: true, timestamps: true, updatedAt: false,
    indexes: [{ fields: ['owner_id'] }],
});
