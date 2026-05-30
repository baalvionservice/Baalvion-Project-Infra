module.exports = function (sequelize, DataTypes) {
    // Bull/bear debate rooms. `meta` carries the full frontend DebateNode (arguments,
    // timeline, votes); `ref` is the short id used in /community/debates/:id URLs.
    return sequelize.define('community_debates', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        ref: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        topic: { type: DataTypes.STRING(300), allowNull: false },
        category: { type: DataTypes.STRING(50), allowNull: true },
        status: { type: DataTypes.STRING(20), allowNull: true },
        meta: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        tableName: 'community_debates', schema: 'imperialpedia', timestamps: true, underscored: true,
        indexes: [{ unique: true, fields: ['ref'] }, { fields: ['status'] }],
    });
};
