'use strict';
module.exports = (sequelize, DataTypes) => {
    const Document = sequelize.define('Document', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        owner_id: { type: DataTypes.TEXT, allowNull: false },
        case_id: { type: DataTypes.INTEGER, allowNull: true },
        name: { type: DataTypes.STRING(500), allowNull: false },
        type: { type: DataTypes.TEXT },
        url: { type: DataTypes.TEXT, allowNull: false },
        size: { type: DataTypes.INTEGER, defaultValue: 0, comment: 'Size in bytes' },
        category: {
            type: DataTypes.ENUM('evidence', 'contract', 'brief', 'court_filing', 'other'),
            defaultValue: 'other',
        },
    }, {
        schema: 'legal',
        tableName: 'documents',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    Document.associate = (db) => {
        Document.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
    };

    return Document;
};
