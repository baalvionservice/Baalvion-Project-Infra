'use strict';
// Logistics Core Foundation (Phase 1) — documents the intended role -> permission
// matrix for the ~25 logistics roles in the spec. GLOBAL reference data (no
// tenant_id, like HsCode/Carrier): this is a catalog, not tenant state. It does
// NOT grant permissions by itself — `req.auth.permissions` is issued by the
// gateway/identity stack (see middleware/permissions.js). This table exists so
// the intended matrix is inspectable/testable in-repo pending identity-domain's
// registration of the same strings in rbac-service.
module.exports = (sequelize, DataTypes) => {
    const LogisticsRolePermission = sequelize.define('LogisticsRolePermission', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        role: { type: DataTypes.TEXT, allowNull: false },
        permission: { type: DataTypes.TEXT, allowNull: false },
        description: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'logistics_role_permissions',
        underscored: true,
        timestamps: true,
        indexes: [{ unique: true, fields: ['role', 'permission'] }],
    });

    return LogisticsRolePermission;
};
