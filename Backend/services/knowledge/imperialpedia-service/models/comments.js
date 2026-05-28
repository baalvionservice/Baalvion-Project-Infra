module.exports = function (sequelize, DataTypes) {
    return sequelize.define('comments', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        post_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'community_posts', schema: 'imperialpedia' }, key: 'id' } },
        author_id: { type: DataTypes.INTEGER, allowNull: true },
        author_name: { type: DataTypes.STRING(200), allowNull: true },
        content: { type: DataTypes.TEXT, allowNull: false },
        upvotes: { type: DataTypes.INTEGER, defaultValue: 0 },
        parent_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: { tableName: 'comments', schema: 'imperialpedia' }, key: 'id' } },
        status: {
            type: DataTypes.ENUM('active', 'removed'),
            defaultValue: 'active',
        },
    }, {
        tableName: 'comments',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['post_id'] },
            { fields: ['parent_id'] },
            { fields: ['author_id'] },
            { fields: ['status'] },
        ],
    });
};
