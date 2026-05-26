'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TeamMember = sequelize.define('TeamMember', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        full_name: { type: DataTypes.STRING(255), allowNull: false },
        role_title: { type: DataTypes.STRING(255), allowNull: false },
        department: { type: DataTypes.STRING(100), allowNull: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        avatar_url: { type: DataTypes.TEXT, allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: true },
        linkedin_url: { type: DataTypes.TEXT, allowNull: true },
        twitter_url: { type: DataTypes.TEXT, allowNull: true },
        github_url: { type: DataTypes.TEXT, allowNull: true },
        order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        joined_year: { type: DataTypes.INTEGER, allowNull: true },
    }, {
        tableName: 'team_members',
        schema: 'about',
        underscored: true,
        timestamps: true,
    });
    return TeamMember;
};
