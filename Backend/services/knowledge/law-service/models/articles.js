'use strict';
module.exports = (sequelize, DataTypes) => {
    const Article = sequelize.define('Article', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        author_id: { type: DataTypes.INTEGER },
        title: { type: DataTypes.STRING(500), allowNull: false },
        slug: { type: DataTypes.STRING(500), allowNull: false, unique: true },
        content: { type: DataTypes.TEXT },
        excerpt: { type: DataTypes.TEXT },
        alphabet: { type: DataTypes.CHAR(1) },
        category_id: { type: DataTypes.INTEGER },
        subcategory_id: { type: DataTypes.INTEGER },
        tags: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        views: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            defaultValue: 'draft',
        },
        published_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        schema: 'legal',
        tableName: 'articles',
        underscored: true,
        timestamps: true,
    });

    Article.associate = (db) => {
        Article.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category' });
        Article.belongsTo(db.Subcategory, { foreignKey: 'subcategory_id', as: 'subcategory' });
        Article.belongsTo(db.User, { foreignKey: 'author_id', as: 'author' });
    };

    return Article;
};
