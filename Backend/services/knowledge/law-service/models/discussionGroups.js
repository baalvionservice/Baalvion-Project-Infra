'use strict';
module.exports = (sequelize, DataTypes) => {
    const DiscussionGroup = sequelize.define('DiscussionGroup', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.INTEGER },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        schema: 'legal',
        tableName: 'discussion_groups',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    DiscussionGroup.associate = (db) => {
        DiscussionGroup.belongsTo(db.Lawyer, { foreignKey: 'created_by', as: 'creator' });
        DiscussionGroup.hasMany(db.GroupMember, { foreignKey: 'group_id', as: 'members' });
        DiscussionGroup.hasMany(db.GroupPost, { foreignKey: 'group_id', as: 'posts' });
    };

    return DiscussionGroup;
};
