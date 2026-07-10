module.exports = function (sequelize, DataTypes) {
    return sequelize.define('article', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        source_id: { type: DataTypes.UUID, allowNull: false },
        external_guid: { type: DataTypes.TEXT, allowNull: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        url: { type: DataTypes.TEXT, allowNull: false },
        summary_raw: { type: DataTypes.TEXT, allowNull: true },
        summary_ai: { type: DataTypes.TEXT, allowNull: true },
        published_at: { type: DataTypes.DATE, allowNull: false },
        ingested_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        country: { type: DataTypes.STRING(2), allowNull: true },
        language: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'en' },
        category: {
            type: DataTypes.ENUM('AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'),
            allowNull: false,
        },
        sentiment: { type: DataTypes.ENUM('positive', 'neutral', 'negative'), allowNull: true },
        entities: { type: DataTypes.JSONB, allowNull: true },
        dedupe_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        raw_payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    }, {
        tableName: 'articles',
        schema: 'news_intelligence',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['source_id'] },
            { fields: ['published_at'] },
            { fields: ['category'] },
            { fields: ['country'] },
        ],
    });
};
