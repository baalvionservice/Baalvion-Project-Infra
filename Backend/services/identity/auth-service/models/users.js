module.exports = function (sequelize, DataTypes) {
    return sequelize.define('users', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password_hash: { type: DataTypes.TEXT, allowNull: false },
        full_name: { type: DataTypes.TEXT, allowNull: true },
        avatar_url: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        email_verified_at: { type: DataTypes.DATE, allowNull: true },
        // Phone verification (public buyer/seller self-service). Set via the phone OTP flow;
        // phone_verified_at is stamped only after a code from auth.phone_otps is confirmed.
        phone: { type: DataTypes.STRING(32), allowNull: true },
        phone_verified_at: { type: DataTypes.DATE, allowNull: true },
        mfa_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        mfa_secret: { type: DataTypes.TEXT, allowNull: true },
        mfa_pending_secret: { type: DataTypes.TEXT, allowNull: true },
        recovery_codes: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
        last_login_at: { type: DataTypes.DATE, allowNull: true },
        // Force-MFA: when true the user must enrol an authenticator before operating.
        mfa_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        // C4: GLOBAL platform-operator role, separate from org membership. NULL for ordinary
        // tenant users. Only platform_admin/platform_security_admin may bypass tenant isolation;
        // this is the single authoritative source of a cross-tenant grant (added to roles[] at
        // issuance). See migration 006_user_platform_role.sql.
        platform_role: { type: DataTypes.STRING(32), allowNull: true, defaultValue: null },
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
