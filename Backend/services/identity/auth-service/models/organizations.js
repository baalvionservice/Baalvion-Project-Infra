module.exports = function (sequelize, DataTypes) {
    return sequelize.define('organizations', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        plan: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'free' },
        owner_id: { type: DataTypes.BIGINT, allowNull: false },
    }, {
        sequelize,
        tableName: 'organizations',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['slug'] },
            { fields: ['owner_id'] },
        ],
    });
};
