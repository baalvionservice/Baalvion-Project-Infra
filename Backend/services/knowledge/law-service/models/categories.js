'use strict';
// This table is created by sequelize.sync() and empty on prod -- the real
// practice-area taxonomy (names, slugs, URL structure) is owned by the
// frontend's bundled src/data/articles/*.ts, not here. This model exists for
// admin-managed categories that supplement the bundled baseline, not replace it.
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT },
        icon: { type: DataTypes.STRING(100) },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        schema: 'legal',
        tableName: 'categories',
        underscored: true,
        timestamps: true,
    });

    Category.associate = (db) => {
        Category.hasMany(db.Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
        Category.hasMany(db.Article, { foreignKey: 'category_id', as: 'articles' });
    };

    return Category;
};
