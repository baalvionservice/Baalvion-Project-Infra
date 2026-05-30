module.exports = function (sequelize, DataTypes) {
    // Generic knowledge-graph entity: companies, countries, industries, technologies,
    // (and future people/universities/markets). Base columns are shared; type-specific
    // fields live in `attributes` (JSONB) and are flattened back out by the serializer.
    return sequelize.define('entities', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        type: { type: DataTypes.STRING(50), allowNull: false },
        name: { type: DataTypes.STRING(300), allowNull: false },
        slug: { type: DataTypes.STRING(300), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        category: { type: DataTypes.STRING(150), allowNull: true },
        country: { type: DataTypes.STRING(150), allowNull: true },
        industry: { type: DataTypes.STRING(150), allowNull: true },
        image: { type: DataTypes.STRING(500), allowNull: true },
        tags: { type: DataTypes.JSONB, defaultValue: [] },
        attributes: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        tableName: 'entities',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['type', 'slug'] },
            { fields: ['type'] },
            { fields: ['country'] },
            { fields: ['industry'] },
        ],
    });
};
