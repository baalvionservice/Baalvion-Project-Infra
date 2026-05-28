module.exports = function (sequelize, DataTypes) {
    return sequelize.define('team_members', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, allowNull: false },
        org_id: { type: DataTypes.UUID, allowNull: false },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        role: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'member' },
        service_roles: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        invited_by: { type: DataTypes.BIGINT, allowNull: true },
        joined_at: { type: DataTypes.DATE, allowNull: true },
        status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
    }, {
        sequelize,
        tableName: 'team_members',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['org_id', 'user_id'] },
            { fields: ['user_id'] },
        ],
    });
};
