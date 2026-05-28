'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrDocument = sequelize.define('IrDocument', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        category: { type: DataTypes.STRING(100) },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT },
        document_url: { type: DataTypes.STRING(500), allowNull: false },
        file_size_kb: { type: DataTypes.INTEGER },
        language: { type: DataTypes.STRING(10), defaultValue: 'en' },
        tags: { type: DataTypes.JSONB, defaultValue: [] },
        is_public: { type: DataTypes.BOOLEAN, defaultValue: true },
        downloads_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        published_at: { type: DataTypes.DATE },
        created_by: { type: DataTypes.INTEGER },
    }, {
        schema: 'ir',
        tableName: 'ir_documents',
        underscored: true,
        timestamps: true,
    });
    return IrDocument;
};
