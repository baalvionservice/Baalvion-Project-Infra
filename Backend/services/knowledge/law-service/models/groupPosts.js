'use strict';
module.exports = (sequelize, DataTypes) => {
    const GroupPost = sequelize.define('GroupPost', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        group_id: { type: DataTypes.INTEGER, allowNull: false },
        author_id: { type: DataTypes.INTEGER, allowNull: false },
        post_type: {
            type: DataTypes.ENUM('update', 'question', 'answer'),
            defaultValue: 'update',
        },
        parent_post_id: { type: DataTypes.INTEGER },
        content: { type: DataTypes.TEXT, allowNull: false },
    }, {
        schema: 'legal',
        tableName: 'group_posts',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    GroupPost.associate = (db) => {
        GroupPost.belongsTo(db.DiscussionGroup, { foreignKey: 'group_id', as: 'group' });
        GroupPost.belongsTo(db.Lawyer, { foreignKey: 'author_id', as: 'author' });
        GroupPost.belongsTo(db.GroupPost, { foreignKey: 'parent_post_id', as: 'parentPost' });
        GroupPost.hasMany(db.GroupPost, { foreignKey: 'parent_post_id', as: 'answers' });
    };

    return GroupPost;
};
