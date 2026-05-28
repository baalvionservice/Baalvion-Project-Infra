'use strict';
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
