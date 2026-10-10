'use strict';
const { DataTypes } = require('sequelize');

// Metadata layer over a NodeBB topic id (tid) — see migration 037 header. NodeBB itself
// remains the system of record for the thread's actual title/content/posts.
module.exports = (sequelize) => sequelize.define('CommunityThread', {
    tid: { type: DataTypes.INTEGER, primaryKey: true },
    community_id: { type: DataTypes.UUID, allowNull: false },
    thread_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'discussion' },
    is_answered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    accepted_pid: { type: DataTypes.INTEGER, allowNull: true },
    author_user_id: { type: DataTypes.UUID, allowNull: false },
}, {
    tableName: 'community_threads',
    schema: 'community',
    underscored: true,
    timestamps: true,
});
