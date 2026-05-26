module.exports = function (sequelize, DataTypes) {
    return sequelize.define('votes', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        target_type: {
            type: DataTypes.ENUM('post', 'comment', 'article'),
            allowNull: false,
        },
        target_id: { type: DataTypes.INTEGER, allowNull: false },
        value: { type: DataTypes.INTEGER, allowNull: false }, // 1 or -1
    }, {
        tableName: 'votes',
        schema: 'imperialpedia',
        timestamps: false,
        underscored: true,
        indexes: [
            { unique: true, fields: ['user_id', 'target_type', 'target_id'] },
            { fields: ['target_type', 'target_id'] },
        ],
    });
};
