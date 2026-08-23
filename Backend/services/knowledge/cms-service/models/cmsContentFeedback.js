module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_content_feedback', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        websiteId: { type: DataTypes.UUID, allowNull: false },
        contentId: { type: DataTypes.UUID, allowNull: false },
        // 'helpful' | 'not_helpful'
        vote: { type: DataTypes.STRING(20), allowNull: false },
        // Client-generated id (localStorage), not tied to any account -- de-dupes
        // repeat votes from the same browser. Enforced unique with content_id at
        // the DB level, see migration.
        voterToken: { type: DataTypes.STRING(64), allowNull: false },
    }, {
        sequelize,
        tableName: 'cms_content_feedback',
        schema: 'cms',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            { fields: ['content_id'] },
            { unique: true, fields: ['content_id', 'voter_token'], name: 'cms_content_feedback_content_voter_unique' },
        ],
    });
};
