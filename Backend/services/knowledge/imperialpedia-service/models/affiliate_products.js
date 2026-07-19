module.exports = function (sequelize, DataTypes) {
    return sequelize.define('affiliate_products', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        tracking_code: { type: DataTypes.STRING(16), allowNull: false, unique: true },
        product_name: { type: DataTypes.STRING(255), allowNull: false },
        merchant_name: { type: DataTypes.STRING(255), allowNull: false },
        category: { type: DataTypes.STRING(100), allowNull: true },
        cta_url: { type: DataTypes.STRING(2048), allowNull: false },
        disclosure_text: { type: DataTypes.TEXT, allowNull: true },
        commission_rate: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
        // Admin-entered assumption for the revenue ESTIMATE in the report module — see
        // migrations/20260005-add-avg-order-value-to-affiliate-products.js for why this is an
        // estimate, not tracked revenue.
        avg_order_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        // Loose reference to articles.id — see Article.belongsTo(CreatorProfile) in
        // models/index.js for the same no-FK-constraint pattern used elsewhere.
        article_id: { type: DataTypes.INTEGER, allowNull: true },
        status: { type: DataTypes.ENUM('active', 'paused', 'archived'), allowNull: false, defaultValue: 'active' },
        clicks_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        tableName: 'affiliate_products',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['slug'] },
            { unique: true, fields: ['tracking_code'] },
            { fields: ['category'] },
            { fields: ['article_id'] },
            { fields: ['status'] },
        ],
    });
};
