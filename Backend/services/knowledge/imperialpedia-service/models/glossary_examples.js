module.exports = function (sequelize, DataTypes) {
    // A worked example attached to a glossary term (may contain inline $math$).
    return sequelize.define('glossary_examples', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        term_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(200), allowNull: true },
        body: { type: DataTypes.TEXT, allowNull: false },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'glossary_examples',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['term_id'] },
        ],
    });
};
