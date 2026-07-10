module.exports = function (sequelize, DataTypes) {
    return sequelize.define('source', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        type: { type: DataTypes.ENUM('rss', 'press_release', 'government'), allowNull: false, defaultValue: 'rss' },
        feed_url: { type: DataTypes.TEXT, allowNull: false, unique: true },
        country: { type: DataTypes.STRING(2), allowNull: true },
        language: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'en' },
        default_category: {
            type: DataTypes.ENUM('AI', 'Technology', 'Business', 'Finance', 'Startups', 'Cybersecurity', 'World', 'Science'),
            allowNull: false,
        },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        poll_interval_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
        last_polled_at: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'sources',
        schema: 'news_intelligence',
        timestamps: true,
        underscored: true,
        indexes: [{ fields: ['is_active'] }],
    });
};
