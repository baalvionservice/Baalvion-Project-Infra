module.exports = function (sequelize, DataTypes) {
    // Investopedia-style financial glossary term. The structured term is the system of record
    // for tooltips, search, related-terms graph and schema markup; an optional long-form
    // explainer lives in cms-service (cms_content_id, soft cross-schema reference).
    return sequelize.define('glossary_terms', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        term: { type: DataTypes.STRING(200), allowNull: false },
        slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
        short_def: { type: DataTypes.TEXT, allowNull: false },          // tooltip-length, <= 320 chars
        full_def: { type: DataTypes.TEXT, allowNull: false },           // 1-3 paragraphs
        formula_latex: { type: DataTypes.TEXT, allowNull: true },
        pronunciation: { type: DataTypes.STRING(120), allowNull: true },
        aliases: { type: DataTypes.JSONB, defaultValue: [] },           // ["PE","P/E ratio"]
        references: { type: DataTypes.JSONB, defaultValue: [] },        // [{title,url,kind}]
        difficulty: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: 'beginner',
            validate: { isIn: [['beginner', 'intermediate', 'advanced', 'expert']] },
        },
        category: { type: DataTypes.STRING(120), allowNull: true },     // Valuation, Derivatives, ...
        cms_content_id: { type: DataTypes.UUID, allowNull: true },      // 1:1 long-form explainer (soft ref)
        status: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'review', 'published', 'archived']] },
        },
        view_count: { type: DataTypes.BIGINT, defaultValue: 0 },
        // Subject id from the RS256 token (`sub`) — may be numeric OR a UUID depending on the
        // issuer, so store as string to avoid insert-time type-cast failures.
        created_by: { type: DataTypes.STRING(64), allowNull: true },
        updated_by: { type: DataTypes.STRING(64), allowNull: true },
    }, {
        tableName: 'glossary_terms',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['slug'] },
            { fields: ['difficulty'] },
            { fields: ['category'] },
            { fields: ['status'] },
        ],
    });
};
