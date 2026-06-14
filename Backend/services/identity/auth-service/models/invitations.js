module.exports = function (sequelize, DataTypes) {
    return sequelize.define('invitations', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        org_id: { type: DataTypes.UUID, allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        role: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'member' },
        token_hash: { type: DataTypes.TEXT, allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        accepted_at: { type: DataTypes.DATE, allowNull: true },
        revoked_at: { type: DataTypes.DATE, allowNull: true },
        full_name: { type: DataTypes.STRING(200), allowNull: true },
        created_by: { type: DataTypes.BIGINT, allowNull: false },
    }, {
        sequelize,
        tableName: 'invitations',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['org_id'] },
            { fields: ['token_hash'] },
            { fields: ['email'] },
        ],
    });
};
