module.exports = function (sequelize, DataTypes) {
    return sequelize.define('users', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password_hash: { type: DataTypes.TEXT, allowNull: false },
        full_name: { type: DataTypes.TEXT, allowNull: true },
        avatar_url: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        email_verified_at: { type: DataTypes.DATE, allowNull: true },
        mfa_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        mfa_secret: { type: DataTypes.TEXT, allowNull: true },
        mfa_pending_secret: { type: DataTypes.TEXT, allowNull: true },
        recovery_codes: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
    }, {
        sequelize,
        tableName: 'users',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['email'] },
            { fields: ['status'] },
        ],
    });
};
