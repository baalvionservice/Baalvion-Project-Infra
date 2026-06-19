'use strict';
module.exports = (sequelize, DataTypes) => {
    // Append-only audit log with a tamper-evident hash chain. Each row's hash =
    // sha256(prevHash + canonical(payload)); verifying recomputes the chain.
    const AuditLog = sequelize.define('AuditLog', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        seq: { type: DataTypes.INTEGER, autoIncrement: true, unique: true },
        tenantId: { type: DataTypes.STRING(64), defaultValue: 'T-DEMO' },
        actorId: { type: DataTypes.STRING },
        action: { type: DataTypes.STRING },
        resourceType: { type: DataTypes.STRING },
        resourceId: { type: DataTypes.STRING },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
        // Exact ISO string that was hashed (avoids Date round-trip drift).
        createdAt: { type: DataTypes.STRING(40) },
        prevHash: { type: DataTypes.STRING(64) },
        hash: { type: DataTypes.STRING(64) },
    }, {
        schema: 'trade',
        tableName: 'audit_logs',
        underscored: false,
        timestamps: false, // append-only; createdAt managed explicitly for hashing
    });

    return AuditLog;
};
