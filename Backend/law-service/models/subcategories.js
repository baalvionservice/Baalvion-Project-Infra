'use strict';
module.exports = (sequelize, DataTypes) => {
    const Subcategory = sequelize.define('Subcategory', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        category_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        schema: 'legal',
        tableName: 'subcategories',
        underscored: true,
        timestamps: true,
    });

    Subcategory.associate = (db) => {
        Subcategory.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category' });
        Subcategory.hasMany(db.Article, { foreignKey: 'subcategory_id', as: 'articles' });
    };

    return Subcategory;
};
