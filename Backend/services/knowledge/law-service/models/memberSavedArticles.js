'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('MemberSavedArticle', {
        user_id: { type: DataTypes.TEXT, primaryKey: true },
        article_slug: { type: DataTypes.STRING(300), primaryKey: true },
    }, {
        schema: 'legal',
        tableName: 'member_saved_articles',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });
