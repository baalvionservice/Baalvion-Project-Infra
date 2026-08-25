module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_content_polls', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        contentId: { type: DataTypes.UUID, allowNull: false },
        question: { type: DataTypes.STRING(500), allowNull: false },
        // Array of option label strings, e.g. ["Yes", "No", "Not sure"].
        options: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        // 'active' | 'closed'
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    }, {
        sequelize,
        tableName: 'cms_content_polls',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['content_id'], name: 'cms_content_polls_content_unique' },
        ],
    });
};
