'use strict';
module.exports = (sequelize, DataTypes) => {
    const RefreshToken = sequelize.define('RefreshToken', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        tenant_id: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'T-DEMO' },
        // All rotations descended from one login share a family_id; reuse of any
        // already-rotated token in a family revokes the whole family (breach).
        family_id: { type: DataTypes.UUID, allowNull: false },
        token_hash: { type: DataTypes.STRING(64), allowNull: false }, // sha256(secret half)
        user_agent: { type: DataTypes.STRING(512) },                  // device fingerprint
        ip: { type: DataTypes.STRING(64) },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        revoked_at: { type: DataTypes.DATE },                         // set on rotate/logout/revoke
        rotated_to: { type: DataTypes.UUID },                         // successor token id
        last_used_at: { type: DataTypes.DATE },
    }, {
        schema: 'trade',
        tableName: 'refresh_tokens',
        underscored: true,
        timestamps: true,
    });
    return RefreshToken;
};
