module.exports = function (sequelize, DataTypes) {
    return sequelize.define('audit_logs', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
        user_id: { type: DataTypes.BIGINT, allowNull: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        action: { type: DataTypes.STRING(100), allowNull: false },
        resource_type: { type: DataTypes.STRING(100), allowNull: true },
        resource_id: { type: DataTypes.STRING(255), allowNull: true },
        metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
        ip_address: { type: DataTypes.STRING(45), allowNull: true },
    }, {
        sequelize,
        tableName: 'audit_logs',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['org_id'] },
            { fields: ['action'] },
            { fields: ['created_at'] },
        ],
    });
};
