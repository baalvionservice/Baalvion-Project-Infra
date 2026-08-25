module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_poll_votes', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        pollId: { type: DataTypes.UUID, allowNull: false },
        optionIndex: { type: DataTypes.INTEGER, allowNull: false },
        // Client-generated id (localStorage) -- same dedupe pattern as cms_content_feedback.
        voterToken: { type: DataTypes.STRING(64), allowNull: false },
    }, {
        sequelize,
        tableName: 'cms_poll_votes',
        schema: 'cms',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            { fields: ['poll_id'] },
            { unique: true, fields: ['poll_id', 'voter_token'], name: 'cms_poll_votes_poll_voter_unique' },
        ],
    });
};
